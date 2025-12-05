import pandas as pd
import json
import statsmodels.api as sm
from datetime import datetime, timedelta
from sklearn.metrics import mean_squared_error, mean_absolute_error
from math import sqrt



def parse_time(value):
    if pd.isna(value):
        return None

    
    try:
        return datetime.strptime(str(value), "%Y-%m-%dT%H:%M:%S.%f%z")
    except:
        pass


    try:
        return datetime.strptime(str(value), "%Y-%m-%dT%H:%M:%S%z")
    except:
        pass

    
    try:
        return pd.to_datetime(value, utc=True)
    except:
        return None



file_path = "Archivos/soterrado_10.xlsx"
df = pd.read_excel(file_path)


df["time"] = df["time"].apply(parse_time)
df = df.dropna(subset=["time"])

df["time"] = df["time"].apply(lambda x: x.replace(tzinfo=None))
df = df.sort_values("time")

df["t"] = df["time"].apply(lambda x: x.toordinal())


sensor_column = "deviceInfo.deviceName"
methane_column = "methane"
vibration_column = "vibration"

sensores = df[sensor_column].unique()

resultado_methane = {}
resultado_vibration = {}



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



for sensor in sensores:
    df_s = df[df[sensor_column] == sensor].copy()

    
    pred_methane = generar_predicciones(df_s, methane_column)
    if pred_methane:
        resultado_methane[sensor] = pred_methane

    pred_vibration = generar_predicciones(df_s, vibration_column)
    if pred_vibration:
        resultado_vibration[sensor] = pred_vibration


json_methane = json.dumps(resultado_methane, indent=4)
with open("predicciones_soterrado_methaneRL.json", "w", encoding="utf-8") as f:
    f.write(json_methane)
print("✔ Archivo generado: predicciones_soterrado_methaneRL.json")


json_vibration = json.dumps(resultado_vibration, indent=4)
with open("predicciones_soterrado_vibrationRL.json", "w", encoding="utf-8") as f:
    f.write(json_vibration)
print("✔ Archivo generado: predicciones_soterrado_vibrationRL.json")


print("\n=== METHANE ===")
print(json_methane)

print("\n=== VIBRATION ===")
print(json_vibration)
