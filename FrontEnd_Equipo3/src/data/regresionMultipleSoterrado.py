import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import json

# ===========================================================
# 1) CARGAR EXCEL
# ===========================================================
FILE = "./Archivos/dataset_soterrado.xlsx"
df = pd.read_excel(FILE)

df = df.rename(columns={
    "fecha_hora": "fecha",
    "sensor_id": "sensor",
    "moisture": "moisture",
    "temperature": "temp",
    "methane": "methane",
    "vibration": "vibration"
})

df = df.dropna(subset=["fecha", "moisture", "temp", "methane", "vibration"])

df["fecha"] = pd.to_datetime(df["fecha"])
df = df.sort_values("fecha").reset_index(drop=True)

sensores = df["sensor"].unique()

# ===========================================================
# CONTENEDOR RESULTADOS (JSON)
# ===========================================================
resultados = {}

# ===========================================================
# LOOP POR SENSOR
# ===========================================================
for sensor in sensores:
    print("\n==============================")
    print(f"Sensor soterrado: {sensor}")
    print("==============================")

    dS = df[df["sensor"] == sensor].copy()

    # Tiempo continuo
    t0 = dS["fecha"].min()
    dS["t"] = (dS["fecha"] - t0).dt.total_seconds()

    # =======================================================
    # TRAIN / TEST TEMPORAL
    # =======================================================
    X = dS[["t", "temp", "methane", "vibration"]].values
    y = dS["moisture"].values
    fechas = dS["fecha"].values

    split = int(len(dS) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    fechas_test = fechas[split:]

    # =======================================================
    # MODELO OLS — MOISTURE
    # =======================================================
    model = LinearRegression()
    model.fit(X_train, y_train)
    y_pred_test = model.predict(X_test)

    mse = mean_squared_error(y_test, y_pred_test)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred_test)
    r2 = r2_score(y_test, y_pred_test)

    print(f"R²   : {r2:.4f}")
    print(f"MSE  : {mse:.4f}")
    print(f"RMSE : {rmse:.4f}")
    print(f"MAE  : {mae:.4f}")

    # =======================================================
    # 🔹 GRAFICO 1 — SERIE TEMPORAL (TEST)
    # =======================================================
    plt.figure(figsize=(12, 6))
    plt.scatter(fechas_test, y_test, s=20, color="red", label="Moisture real (test)")
    plt.plot(fechas_test, y_pred_test, color="blue", linewidth=2,
             label="Moisture predicho (test)")
    plt.title(f"Moisture real vs predicho — Sensor {sensor}")
    plt.xlabel("Fecha")
    plt.ylabel("Moisture")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.show()

    # =======================================================
    # 🔹 GRAFICO 2 — PREDICCIÓN vs VALOR REAL
    # =======================================================
    plt.figure(figsize=(7, 6))
    plt.scatter(y_test, y_pred_test, alpha=0.7)
    min_v = min(y_test.min(), y_pred_test.min())
    max_v = max(y_test.max(), y_pred_test.max())
    plt.plot([min_v, max_v], [min_v, max_v], "r--", linewidth=2)
    plt.xlabel("Moisture real")
    plt.ylabel("Moisture predicho")
    plt.title(f"Predicción vs Valor Real (OLS)\nSensor {sensor}")
    plt.grid(True)
    plt.tight_layout()
    plt.show()

    # =======================================================
    # 🔹 PRONÓSTICO 7 DÍAS
    # =======================================================
    dt = np.median(np.diff(dS["t"]))
    if np.isnan(dt) or dt <= 0:
        dt = 10 * 60  # 10 minutos respaldo

    n_steps_7 = int((7 * 24 * 3600) // dt)
    t_future_7 = dS["t"].max() + np.arange(1, n_steps_7 + 1) * dt
    fechas_future_7 = t0 + pd.to_timedelta(t_future_7, unit="s")

    temp_7 = np.full(n_steps_7, dS["temp"].mean())
    meth_7 = np.full(n_steps_7, dS["methane"].mean())
    vib_7 = np.full(n_steps_7, dS["vibration"].mean())

    X_future_7 = np.column_stack([t_future_7, temp_7, meth_7, vib_7])
    moisture_7 = model.predict(X_future_7)

    # =======================================================
    # 🔹 PRONÓSTICO 30 DÍAS
    # =======================================================
    n_steps_30 = int((30 * 24 * 3600) // dt)
    t_future_30 = dS["t"].max() + np.arange(1, n_steps_30 + 1) * dt
    fechas_future_30 = t0 + pd.to_timedelta(t_future_30, unit="s")

    temp_30 = np.full(n_steps_30, dS["temp"].mean())
    meth_30 = np.full(n_steps_30, dS["methane"].mean())
    vib_30 = np.full(n_steps_30, dS["vibration"].mean())

    X_future_30 = np.column_stack([t_future_30, temp_30, meth_30, vib_30])
    moisture_30 = model.predict(X_future_30)

    # =======================================================
    # 🔹 GRAFICO 3 — HISTÓRICO + 7 DÍAS
    # =======================================================
    plt.figure(figsize=(12, 6))
    plt.scatter(fechas_test, y_test, s=20, color="red", label="Moisture real (test)")
    plt.plot(fechas_test, y_pred_test, color="blue", linewidth=2,
             label="Moisture predicho (test)")
    plt.plot(fechas_future_7, moisture_7, "g--", linewidth=2,
             label="Moisture estimado (7 días)")
    plt.title(f"Moisture — Histórico y Pronóstico 7 días\nSensor {sensor}")
    plt.xlabel("Fecha")
    plt.ylabel("Moisture")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.show()

    # =======================================================
    # 🔹 GRAFICO 4 — HISTÓRICO + 30 DÍAS
    # =======================================================
    plt.figure(figsize=(12, 6))
    plt.scatter(fechas_test, y_test, s=20, color="red", label="Moisture real (test)")
    plt.plot(fechas_test, y_pred_test, color="blue", linewidth=2,
             label="Moisture predicho (test)")
    plt.plot(fechas_future_30, moisture_30, "purple", linestyle="--", linewidth=2,
             label="Moisture estimado (30 días)")
    plt.title(f"Moisture — Histórico y Pronóstico 30 días\nSensor {sensor}")
    plt.xlabel("Fecha")
    plt.ylabel("Moisture")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.show()

    # =======================================================
    # GUARDAR EN JSON
    # =======================================================
    resultados[str(sensor)] = {
        "metrics": {
            "r2": float(r2),
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae)
        },
        "coefficients": {
            "intercept": model.intercept_,
            "t": model.coef_[0],
            "temp": model.coef_[1],
            "methane": model.coef_[2],
            "vibration": model.coef_[3]
        },
        "test": {
            "dates": fechas_test.astype(str).tolist(),
            "real": y_test.tolist(),
            "pred": y_pred_test.tolist()
        },
        "forecast_7d": {
            "dates": fechas_future_7.astype(str).tolist(),
            "estimated": moisture_7.tolist()
        },
        "forecast_30d": {
            "dates": fechas_future_30.astype(str).tolist(),
            "estimated": moisture_30.tolist()
        }
    }

# ===========================================================
# EXPORTAR RESULTADOS A JSON
# ===========================================================
with open("resultados_soterrados.json", "w", encoding="utf-8") as f:
    json.dump(resultados, f, indent=2, ensure_ascii=False)

print("\n✅ JSON generado: resultados_soterrados.json")
