import pandas as pd
import json
import warnings
from statsmodels.tsa.statespace.sarimax import SARIMAX

warnings.filterwarnings("ignore")

# ================================
# CONFIGURACIÓN GENERAL
# ================================
INPUT_EXCEL = "Archivos/datos_filtrados_sensores.xlsx"

TIME_COL = "time"
SENSOR_COL = "deviceInfo.deviceName"

TEMP_COL = "object.temperature"
HUM_COL = "object.humidity"

RESAMPLE_FREQ = "1H"
SEASONAL_PERIOD = 24


# ================================
# CLASIFICACIÓN TEMPERATURA
# ================================
def clasificar_temp(t):
    if t < 10:
        return "frío"
    elif t < 20:
        return "templado"
    elif t < 30:
        return "caliente"
    else:
        return "riesgo de calor"


# ================================
# CLASIFICACIÓN HUMEDAD
# ================================
def clasificar_hum(h):
    if h < 30:
        return "baja"
    elif h < 60:
        return "normal"
    else:
        return "alta"


# ================================
# ENTRENAR SARIMA
# ================================
def entrenar_y_predecir(series, days=30):
    model = SARIMAX(
        series,
        order=(1, 1, 1),
        seasonal_order=(1, 1, 1, SEASONAL_PERIOD),
        enforce_stationarity=False,
        enforce_invertibility=False
    )

    res = model.fit(disp=False)

    steps = days * 24  # 1 dato por hora

    forecast = res.get_forecast(steps=steps)
    pred = forecast.predicted_mean
    conf = forecast.conf_int()

    return pred, conf


# ================================
# PROCESAR UNA VARIABLE (TEMP/HUM)
# ================================
def procesar_variable(df, col_valor, clasificador):
    sensores = df[SENSOR_COL].unique()
    resultados = {}

    for sensor in sensores:
        df_sensor = df[df[SENSOR_COL] == sensor].copy()
        if df_sensor.empty:
            continue

        df_sensor[TIME_COL] = pd.to_datetime(df_sensor[TIME_COL])
        df_sensor = df_sensor.set_index(TIME_COL).sort_index()

        # Resampleo
        series = df_sensor[col_valor].resample(RESAMPLE_FREQ).mean().interpolate()

        pred_week, conf_week = entrenar_y_predecir(series, 7)
        pred_month, conf_month = entrenar_y_predecir(series, 30)

        # Empaquetar
        def empaquetar(pred, conf):
            out = []
            for ts, value in pred.items():
                out.append({
                    "fecha": str(ts),
                    "valor_predicho": float(value),
                    "clasificacion": clasificador(float(value)),
                    "min": float(conf.loc[ts].iloc[0]),
                    "max": float(conf.loc[ts].iloc[1]),
                })
            return out

        resultados[sensor] = {
            "sensor_name": sensor,
            "weekly_forecast": empaquetar(pred_week, conf_week),
            "monthly_forecast": empaquetar(pred_month, conf_month)
        }

    return resultados


# ================================
# MAIN
# ================================
def main():
    print("📄 Leyendo Excel...")
    df = pd.read_excel(INPUT_EXCEL)

    # ---------- TEMPERATURA ----------
    print("🌡 Procesando temperatura...")
    pred_temp = procesar_variable(df, TEMP_COL, clasificar_temp)

    with open("prediccion_temperaturaSARIMA.json", "w") as f:
        json.dump(pred_temp, f, indent=2)

    print("✔ Archivo generado: prediccion_temperaturaSARIMA.json")

    # ---------- HUMEDAD ----------
    print("💧 Procesando humedad...")
    pred_hum = procesar_variable(df, HUM_COL, clasificar_hum)

    with open("prediccion_humedadSARIMA.json", "w") as f:
        json.dump(pred_hum, f, indent=2)

    print("✔ Archivo generado: prediccion_humedadSARIMA.json")

    print("\n🎉 Predicciones generadas correctamente.\n")


if __name__ == "__main__":
    main()
