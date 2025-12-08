import pandas as pd
from prophet import Prophet
from pathlib import Path

# --- Rutas base ---
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data_input"
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

def cargar_dataset_aire():
    csv_path = DATA_DIR / "dataset_aire.csv"
    df = pd.read_csv(csv_path)

    # Usamos tus columnas reales
    df["fecha_hora"] = pd.to_datetime(df["fecha_hora"], errors="coerce")
    df = df.dropna(subset=["fecha_hora", "co2"])

    # Formato obligatorio Prophet
    df_prophet = pd.DataFrame()
    df_prophet["ds"] = df["fecha_hora"]
    df_prophet["y"] = df["co2"]

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
        json_output["predicciones_7_dias"][fecha] = round(float(fila["yhat"]), 2)

    for _, fila in df_30.iterrows():
        fecha = fila["ds"].strftime("%Y-%m-%d")
        json_output["predicciones_30_dias"][fecha] = round(float(fila["yhat"]), 2)

    output_path = OUTPUT_DIR / "prediccion_co2_prophet.json"
    with open(output_path, "w") as f:
        import json
        json.dump(json_output, f, indent=2)

    print(f"✅ JSON generado en: {output_path}")

def main():
    print("🚀 Entrenando Prophet para AIRE (CO2)...")

    df = cargar_dataset_aire()

    print("📊 Entrenando modelo...")
    pred_7 = entrenar_y_predecir(df, 7)
    pred_30 = entrenar_y_predecir(df, 30)

    generar_json_predicciones(pred_7, pred_30)

    print("✅ Proceso terminado correctamente.")

if __name__ == "__main__":
    main()
