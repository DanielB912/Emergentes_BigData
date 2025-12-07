import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import json

# ===========================================================
# 1) Cargar Excel
# ===========================================================
FILE = "./Archivos/EM500-CO2-915M nov 2024.xlsx"
df = pd.read_excel(FILE)

df = df.rename(columns={
    "time": "fecha",
    "object.co2": "co2",
    "object.temperature": "temp",
    "object.humidity": "humedad",
    "deviceInfo.deviceName": "sensor"
})

df = df.dropna(subset=["fecha", "co2", "temp", "humedad"])

df["fecha"] = pd.to_datetime(df["fecha"], format="ISO8601", utc=True)
df["fecha"] = df["fecha"].dt.tz_convert("America/La_Paz")
df = df.sort_values("fecha").reset_index(drop=True)

sensores = df["sensor"].unique()

# ===========================================================
# CONTENEDOR JSON
# ===========================================================
json_output = {}

# ===========================================================
# LOOP POR SENSOR
# ===========================================================
for sensor in sensores:
    print("\n====================")
    print(f"Sensor: {sensor}")
    print("====================")

    dS = df[df["sensor"] == sensor].copy()

    # Tiempo continuo
    t0 = dS["fecha"].min()
    dS["t"] = (dS["fecha"] - t0).dt.total_seconds()

    # Hora del día
    dS["hour"] = (
        dS["fecha"].dt.hour +
        dS["fecha"].dt.minute / 60 +
        dS["fecha"].dt.second / 3600
    )
    dS["hour_sin"] = np.sin(2 * np.pi * dS["hour"] / 24)
    dS["hour_cos"] = np.cos(2 * np.pi * dS["hour"] / 24)

    # =======================================================
    # TRAIN / TEST
    # =======================================================
    X = dS[["t", "temp", "humedad"]].values
    y = dS["co2"].values
    fechas = dS["fecha"].values

    split = int(len(dS) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    fechas_test = fechas[split:]

    # =======================================================
    # MODELO CO₂
    # =======================================================
    model_co2 = LinearRegression().fit(X_train, y_train)
    y_pred_test = model_co2.predict(X_test)

    # =======================================================
    # MÉTRICAS
    # =======================================================
    mse = mean_squared_error(y_test, y_pred_test)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred_test)
    r2 = r2_score(y_test, y_pred_test)

    print(f"R²   : {r2:.4f}")
    print(f"MSE  : {mse:.4f}")
    print(f"RMSE : {rmse:.4f}")
    print(f"MAE  : {mae:.4f}")

    # =======================================================
    # GRÁFICO 1 — SERIE TEMPORAL (TEST)
    # =======================================================
    plt.figure(figsize=(12, 6))
    plt.scatter(fechas_test, y_test, s=20, color="red", label="CO₂ real (test)")
    plt.plot(fechas_test, y_pred_test, color="blue", linewidth=2,
             label="CO₂ predicho (test)")
    plt.title(f"CO₂ real vs predicho (TEST)\nSensor {sensor}")
    plt.xlabel("Fecha y hora (Bolivia)")
    plt.ylabel("CO₂ (ppm)")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.show()

    # =======================================================
    # GRÁFICO 2 — PREDICCIÓN vs VALOR REAL (OLS)
    # =======================================================
    plt.figure(figsize=(7, 6))
    plt.scatter(y_test, y_pred_test, alpha=0.7, color="royalblue")
    min_val = min(y_test.min(), y_pred_test.min())
    max_val = max(y_test.max(), y_pred_test.max())
    plt.plot([min_val, max_val], [min_val, max_val], "r--", linewidth=2)
    plt.xlabel("CO₂ real (ppm)")
    plt.ylabel("CO₂ predicho (ppm)")
    plt.title(f"Predicción vs Valor Real (OLS)\nSensor {sensor}")
    plt.grid(True)
    plt.tight_layout()
    plt.show()

    # =======================================================
    # MODELOS TEMPERATURA y HUMEDAD (patrón diario)
    # =======================================================
    X_th = dS[["t", "hour_sin", "hour_cos"]].values
    model_temp = LinearRegression().fit(X_th, dS["temp"].values)
    model_hum = LinearRegression().fit(X_th, dS["humedad"].values)

    # =======================================================
    # PASO DE TIEMPO
    # =======================================================
    dt = np.median(np.diff(dS["t"]))
    if np.isnan(dt) or dt <= 0:
        dt = 15 * 60

    # =======================================================
    # PRONÓSTICO 7 DÍAS
    # =======================================================
    n_steps_7 = int((7 * 24 * 3600) // dt)
    t_future_7 = dS["t"].max() + np.arange(1, n_steps_7 + 1) * dt
    fechas_future_7 = t0 + pd.to_timedelta(t_future_7, unit="s")

    hour_7 = fechas_future_7.hour + fechas_future_7.minute/60 + fechas_future_7.second/3600
    hour_sin_7 = np.sin(2 * np.pi * hour_7 / 24)
    hour_cos_7 = np.cos(2 * np.pi * hour_7 / 24)

    temp_7 = model_temp.predict(np.column_stack([t_future_7, hour_sin_7, hour_cos_7]))
    hum_7 = model_hum.predict(np.column_stack([t_future_7, hour_sin_7, hour_cos_7]))
    co2_7 = model_co2.predict(np.column_stack([t_future_7, temp_7, hum_7]))

    # =======================================================
    # PRONÓSTICO 30 DÍAS
    # =======================================================
    n_steps_30 = int((30 * 24 * 3600) // dt)
    t_future_30 = dS["t"].max() + np.arange(1, n_steps_30 + 1) * dt
    fechas_future_30 = t0 + pd.to_timedelta(t_future_30, unit="s")

    hour_30 = fechas_future_30.hour + fechas_future_30.minute/60 + fechas_future_30.second/3600
    hour_sin_30 = np.sin(2 * np.pi * hour_30 / 24)
    hour_cos_30 = np.cos(2 * np.pi * hour_30 / 24)

    temp_30 = model_temp.predict(np.column_stack([t_future_30, hour_sin_30, hour_cos_30]))
    hum_30 = model_hum.predict(np.column_stack([t_future_30, hour_sin_30, hour_cos_30]))
    co2_30 = model_co2.predict(np.column_stack([t_future_30, temp_30, hum_30]))

    # =======================================================
    # GRÁFICO 3 — HISTÓRICO + 7 DÍAS
    # =======================================================
    plt.figure(figsize=(12, 6))
    plt.scatter(fechas_test, y_test, s=20, color="red", label="CO₂ real (test)")
    plt.plot(fechas_test, y_pred_test, color="blue", linewidth=2,
             label="CO₂ predicho (test)")
    plt.plot(fechas_future_7, co2_7, "g--", linewidth=2,
             label="CO₂ estimado (7 días)")
    plt.title(f"CO₂ — Histórico y Pronóstico 7 días\nSensor {sensor}")
    plt.xlabel("Fecha y hora (Bolivia)")
    plt.ylabel("CO₂ (ppm)")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.show()

    # =======================================================
    # GRÁFICO 4 — HISTÓRICO + 30 DÍAS
    # =======================================================
    plt.figure(figsize=(12, 6))
    plt.scatter(fechas_test, y_test, s=20, color="red", label="CO₂ real (test)")
    plt.plot(fechas_test, y_pred_test, color="blue", linewidth=2,
             label="CO₂ predicho (test)")
    plt.plot(fechas_future_30, co2_30, "purple", linestyle="--", linewidth=2,
             label="CO₂ estimado (30 días)")
    plt.title(f"CO₂ — Histórico y Pronóstico 30 días\nSensor {sensor}")
    plt.xlabel("Fecha y hora (Bolivia)")
    plt.ylabel("CO₂ (ppm)")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.show()

    # =======================================================
    # EXPORTAR A JSON
    # =======================================================
    json_output[sensor] = {
        "metrics": {
            "r2": float(r2),
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae)
        },
        "test": {
            "dates": fechas_test.astype(str).tolist(),
            "co2_real": y_test.tolist(),
            "co2_pred": y_pred_test.tolist()
        },
        "forecast_7d": {
            "dates": fechas_future_7.astype(str).tolist(),
            "co2_forecast": co2_7.tolist()
        },
        "forecast_30d": {
            "dates": fechas_future_30.astype(str).tolist(),
            "co2_forecast": co2_30.tolist()
        }
    }

# ===========================================================
# GUARDAR JSON
# ===========================================================
with open("resultados_co2.json", "w", encoding="utf-8") as f:
    json.dump(json_output, f, indent=2, ensure_ascii=False)

print("\n✅ Archivo resultados_co2.json generado correctamente.")
