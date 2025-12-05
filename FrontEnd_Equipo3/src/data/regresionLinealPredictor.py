import pandas as pd
import json
import statsmodels.api as sm
from datetime import datetime, timedelta
from sklearn.metrics import mean_squared_error, mean_absolute_error
from math import sqrt


# ============================================================
# 1. Función robusta para parsear cualquier formato ISO
# ============================================================
def parse_time(value):
    if pd.isna(value):
        return None

    # Intentar formato con milisegundos
    try:
        return datetime.strptime(str(value), "%Y-%m-%dT%H:%M:%S.%f%z")
    except:
        pass

    # Intentar sin milisegundos
    try:
        return datetime.strptime(str(value), "%Y-%m-%dT%H:%M:%S%z")
    except:
        pass

    # Auto-detector
    try:
        return pd.to_datetime(value, utc=True)
    except:
        return None


# ============================================================
# 2. Cargar Excel
# ============================================================
file_path = "Archivos/EM500-CO2-915M nov 2024.xlsx"
df = pd.read_excel(file_path)

# ============================================================
# 3. Procesar columna time
# ============================================================
df["time"] = df["time"].apply(parse_time)

# Eliminar fechas inválidas
df = df.dropna(subset=["time"])

# Quitar zona horaria
df["time"] = df["time"].apply(lambda x: x.replace(tzinfo=None))

# Ordenar por tiempo
df = df.sort_values("time")

# Convertir fecha → número ordinal
df["t"] = df["time"].apply(lambda x: x.toordinal())

# ============================================================
# 4. Identificar columnas
# ============================================================
sensor_column = "deviceInfo.deviceName"
temp_column = "object.temperature"
hum_column = "object.humidity"

sensores = df[sensor_column].unique()

# JSON finales
resultado_temp = {}
resultado_hum = {}

# ============================================================
# 5. Función general para entrenar OLS y generar predicción
# ============================================================
def generar_predicciones(df_sensor, columna_objetivo):
    # Eliminar valores nulos
    df_clean = df_sensor.dropna(subset=[columna_objetivo])

    if len(df_clean) < 10:
        return None

    X = sm.add_constant(df_clean["t"])
    y = df_clean[columna_objetivo]

    model = sm.OLS(y, X).fit()
    y_pred = model.predict(X)

    # Métricas
    r2 = float(model.rsquared)
    rmse = float(sqrt(mean_squared_error(y, y_pred)))
    mae = float(mean_absolute_error(y, y_pred))

    # Predicciones a 7 días
    last_date = df_clean["time"].max()
    pred_semana = {}

    for i in range(1, 8):
        future_date = last_date + timedelta(days=i)
        t_future = future_date.toordinal()
        pred_value = float(model.predict([1, t_future]))
        pred_semana[str(future_date.date())] = pred_value

    return {
        "metricas": {
            "r2": r2,
            "rmse": rmse,
            "mae": mae
        },
        "predicciones_semana_siguiente": pred_semana
    }


# ============================================================
# 6. Procesar cada sensor para temperatura y humedad
# ============================================================
for sensor in sensores:
    df_s = df[df[sensor_column] == sensor].copy()

    # ---------- TEMPERATURA ----------
    pred_temp = generar_predicciones(df_s, temp_column)
    if pred_temp:
        resultado_temp[sensor] = pred_temp

    # ---------- HUMEDAD ----------
    pred_hum = generar_predicciones(df_s, hum_column)
    if pred_hum:
        resultado_hum[sensor] = pred_hum


# ============================================================
# 7. Guardar JSON de Temperatura
# ============================================================
json_temp = json.dumps(resultado_temp, indent=4)
with open("predicciones_temperaturaRL.json", "w", encoding="utf-8") as f:
    f.write(json_temp)

print("✔ Archivo generado: predicciones_temperaturaRL.json")

# ============================================================
# 8. Guardar JSON de Humedad
# ============================================================
json_hum = json.dumps(resultado_hum, indent=4)
with open("predicciones_humedadRL.json", "w", encoding="utf-8") as f:
    f.write(json_hum)

print("✔ Archivo generado: predicciones_humedadRL.json")

# También mostrar en consola
print("\n=== TEMPERATURA ===")
print(json_temp)
print("\n=== HUMEDAD ===")
print(json_hum)
