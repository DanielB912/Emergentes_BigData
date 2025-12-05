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
file_path = "Archivos/WS302-915M SONIDO NOV 2024.xlsx"
df = pd.read_excel(file_path)

# ============================================================
# 3. Procesar columna time
# ============================================================
df["time"] = df["time"].apply(parse_time)

df = df.dropna(subset=["time"])

df["time"] = df["time"].apply(lambda x: x.replace(tzinfo=None))

df = df.sort_values("time")

df["t"] = df["time"].apply(lambda x: x.toordinal())

# ============================================================
# 4. Columnas de interés
# ============================================================
sensor_column = "deviceInfo.deviceName"
laeq_column = "object.LAeq"
laimax_column = "object.LAImax"

sensores = df[sensor_column].unique()

resultado_laeq = {}
resultado_laimax = {}

# ============================================================
# 5. Función para generar predicciones OLS
# ============================================================
def generar_predicciones(df_sensor, columna_objetivo):
    df_clean = df_sensor.dropna(subset=[columna_objetivo])

    if len(df_clean) < 10:
        return None

    X = sm.add_constant(df_clean["t"])
    y = df_clean[columna_objetivo]

    model = sm.OLS(y, X).fit()
    y_pred = model.predict(X)

    r2 = float(model.rsquared)
    rmse = float(sqrt(mean_squared_error(y, y_pred)))
    mae = float(mean_absolute_error(y, y_pred))

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
# 6. Calcular predicciones por sensor
# ============================================================
for sensor in sensores:
    df_s = df[df[sensor_column] == sensor].copy()

    # LAeq
    pred_laeq = generar_predicciones(df_s, laeq_column)
    if pred_laeq:
        resultado_laeq[sensor] = pred_laeq

    # LAImax
    pred_laimax = generar_predicciones(df_s, laimax_column)
    if pred_laimax:
        resultado_laimax[sensor] = pred_laimax


# ============================================================
# 7. Exportar JSONs
# ============================================================
json_laeq = json.dumps(resultado_laeq, indent=4)
with open("predicciones_sonido_laeqRL.json", "w", encoding="utf-8") as f:
    f.write(json_laeq)
print("✔ Archivo generado: predicciones_sonido_laeqRL.json")

json_laimax = json.dumps(resultado_laimax, indent=4)
with open("predicciones_sonido_laimaxRL.json", "w", encoding="utf-8") as f:
    f.write(json_laimax)
print("✔ Archivo generado: predicciones_sonido_laimaxRL.json")


# Opcional: mostrarlos en consola
print("\n=== LAeq ===")
print(json_laeq)

print("\n=== LAImax ===")
print(json_laimax)
