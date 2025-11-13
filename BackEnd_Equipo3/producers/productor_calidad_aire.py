import json
import logging
import os
import random
import time
from datetime import datetime, timezone
import pandas as pd
from kafka import KafkaProducer

# --- Configuración ---
KAFKA_BROKER_URL = os.getenv("KAFKA_BROKER_URL", "localhost:9092")
TOPIC_NAME = "datos_calidad_aire"
DATA_DIRECTORY = "datos_sensores/calidad_aire"
DELAY_SECONDS = 2
LOOP_DATA = True

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger("ProductorCalidadAire")

# --- Crear productor Kafka ---
def crear_productor():
    try:
        return KafkaProducer(
            bootstrap_servers=[KAFKA_BROKER_URL],
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
    except Exception as e:
        logger.error(f"Error conectando con Kafka: {e}")
        return None

# --- Cargar CSV ---
def cargar_datos():
    if not os.path.exists(DATA_DIRECTORY):
        logger.warning(f"No se encontró {DATA_DIRECTORY}, usando datos simulados.")
        return []

    archivos = [
        os.path.join(DATA_DIRECTORY, f)
        for f in os.listdir(DATA_DIRECTORY)
        if f.endswith(".csv")
    ]

    if not archivos:
        logger.warning("No hay CSV, usando datos simulados.")
        return []

    df = pd.concat([pd.read_csv(f) for f in archivos], ignore_index=True)

    # Ajustar tiempo
    df["time"] = pd.to_datetime(df["time"], errors="coerce")
    df = df.sort_values("time").reset_index(drop=True)
    desfase = datetime.now(timezone.utc) - df["time"].iloc[0].replace(tzinfo=timezone.utc)
    df["time"] = df["time"].apply(lambda t: t.replace(tzinfo=timezone.utc) + desfase)

    return df.to_dict("records")

# --- Construir mensaje ---
def construir_mensaje(registro):
    mensaje = {
        "time": registro.get("time", datetime.now(timezone.utc).isoformat()),
        "deviceInfo": {"deviceName": registro.get("deviceName", "Sensor_Aire")},
        "object": {
            "temperature": float(registro.get("temperature", 0)),
            "humidity": float(registro.get("humidity", 0)),
            "co2": float(registro.get("co2", 0)),
            "pressure": float(registro.get("pressure", 0)),
        },
    }
    return mensaje

# --- Simulación ---
def generar_dato_aleatorio():
    return {
        "time": datetime.now(timezone.utc).isoformat(),
        "deviceInfo": {"deviceName": f"Sensor_Aire_{random.randint(1,3)}"},
        "object": {
            "temperature": round(random.uniform(18, 32), 2),
            "humidity": round(random.uniform(40, 75), 2),
            "co2": random.randint(400, 1500),
            "pressure": round(random.uniform(1010, 1025), 2),
        },
    }

# --- Main ---
def main():
    productor = crear_productor()
    if not productor:
        return

    datos = cargar_datos()
    logger.info(f"Iniciando envío al topic {TOPIC_NAME}")

    try:
        while True:
            if not datos:
                datos = [generar_dato_aleatorio()]

            for registro in datos:
                mensaje = construir_mensaje(registro)
                productor.send(TOPIC_NAME, value=mensaje)
                logger.info(f"Enviado: {mensaje}")
                time.sleep(DELAY_SECONDS)

            if not LOOP_DATA:
                break

    except KeyboardInterrupt:
        logger.info("Productor detenido por el usuario.")
    finally:
        productor.close()

if __name__ == "__main__":
    main()
