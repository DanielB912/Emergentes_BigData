import pandas as pd
from prophet import Prophet
from pathlib import Path
import json

# --- Rutas base ---
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data_input"
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

def cargar_dataset_soterrado():
    csv_path = DATA_DIR / "dataset_soterrado.csv"
    df = pd.read_csv(csv_path)

    # ✅ Columnas reales
    df["fecha_hora"] = pd.to_datetime(df["fecha_hora"], errors="coerce")
    df = df.dropna(subset=["fecha_hora", "methane"])

    # ✅ Formato Prophet
    df_prophet = pd.DataFrame()
    df_prophet["ds"] = df["fecha_hora"]
    df_prophet["y"] = df["methane"]

    return df_prophet

def entrenar_y_predecir(df, dias):
    modelo = Prophet()
    modelo.fit(df)

    futuro = modelo.make_future_dataframe(periods=dias, freq="D")
    pred = modelo.predict(futuro)

    resultado = pred[["ds", "yhat"]].tail(dias)
    return resultado

def generar_json_predicciones(df_7, df_30):
    json_output = {
        "predicciones_7_dias": {},
        "predicciones_30_dias": {}
    }

    for _, fila in df_7.iterrows():
        fecha = fila["ds"].strftime("%Y-%m-%d")
        json_output["predicciones_7_dias"][fecha] = round(float(fila["yhat"]), 4)

    for _, fila in df_30.iterrows():
        fecha = fila["ds"].strftime("%Y-%m-%d")
        json_output["predicciones_30_dias"][fecha] = round(float(fila["yhat"]), 4)

    output_path = OUTPUT_DIR / "prediccion_soterrado_prophet.json"
    with open(output_path, "w") as f:
        json.dump(json_output, f, indent=2)

    print(f"✅ JSON generado en: {output_path}")

def main():
    print("🚀 Entrenando Prophet para SOTERRADO (METHANE)...")

    df = cargar_dataset_soterrado()

    pred_7 = entrenar_y_predecir(df, 7)
    pred_30 = entrenar_y_predecir(df, 30)

    generar_json_predicciones(pred_7, pred_30)
    print("✅ Proceso de SOTERRADO terminado correctamente.")

if __name__ == "__main__":
    main()
