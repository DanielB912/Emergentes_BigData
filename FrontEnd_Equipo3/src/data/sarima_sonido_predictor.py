import pandas as pd
import json
import warnings
from statsmodels.tsa.statespace.sarimax import SARIMAX

warnings.filterwarnings("ignore")

# ================================
# CONFIGURACIÓN GENERAL
# ================================
INPUT_EXCEL = "Archivos/datos_sonido_filtrados.xlsx"

TIME_COL = "time"
SENSOR_COL = "deviceInfo.deviceName"

LAEQ_COL = "object.LAeq"
LAIMAX_COL = "object.LAImax"

RESAMPLE_FREQ = "1H"
SEASONAL_PERIOD = 24


# ================================
# CLASIFICACIÓN PARA SONIDO (LAeq)
# ================================
def clasificar_laeq(x):
    if x < 40:
        return "muy bajo"
    elif x < 60:
        return "moderado"
    elif x < 80:
        return "alto"
    else:
        return "riesgoso"


# ================================
# CLASIFICACIÓN PARA SONIDO (LAImax)
# ================================
def clasificar_laimax(x):
    if x < 60:
        return "pico leve"
    elif x < 90:
        return "pico normal"
    elif x < 110:
        return "pico alto"
    else:
        return "pico extremo"


# ================================
# ENTRENAR Y PREDECIR SARIMA
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
    steps = days * 24

    forecast = res.get_forecast(steps=steps)
    pred = forecast.predicted_mean
    conf = forecast.conf_int()

    return pred, conf


# ================================
# PROCESAR UNA VARIABLE DE SONIDO
# ================================
def procesar_variable(df, col_valor, clasificador):
    sensores = df[SENSOR_COL].unique()
    resultados = {}

    for sensor in sensores:
        df_sensor = df[df[SENSOR_COL] == sensor].copy()

        if df_sensor.empty:
            print(f"⚠ El sensor {sensor} no tiene datos suficientes.")
            continue

        df_sensor[TIME_COL] = pd.to_datetime(df_sensor[TIME_COL])
        df_sensor = df_sensor.set_index(TIME_COL).sort_index()

        # Resample a 1 hora
        series = df_sensor[col_valor].resample(RESAMPLE_FREQ).mean().interpolate()

        # Predicciones
        pred_week, conf_week = entrenar_y_predecir(series, 7)
        pred_month, conf_month = entrenar_y_predecir(series, 30)

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
            "monthly_forecast": empaquetar(pred_month, conf_month),
        }

    return resultados


# ================================
# MAIN
# ================================
def main():
    print("📄 Leyendo Excel de sonido...")
    df = pd.read_excel(INPUT_EXCEL)

    # ---------- LAeq ----------
    print("🔧 Generando predicción de LAeq...")
    resultados_laeq = procesar_variable(df, LAEQ_COL, clasificar_laeq)

    with open("prediccion_sonido_laeqSARIMA.json", "w") as f:
        json.dump(resultados_laeq, f, indent=2)

    print("✔ Archivo generado: prediccion_sonido_laeqSARIMA.json")

    # ---------- LAImax ----------
    print("🔧 Generando predicción de LAImax...")
    resultados_laimax = procesar_variable(df, LAIMAX_COL, clasificar_laimax)

    with open("prediccion_sonido_laimaxSARIMA.json", "w") as f:
        json.dump(resultados_laimax, f, indent=2)

    print("✔ Archivo generado: prediccion_sonido_laimaxSARIMA.json")

    print("\n🎉 Proceso completado con éxito.\n")


if __name__ == "__main__":
    main()
