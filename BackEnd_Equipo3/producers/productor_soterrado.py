import json
import logging
import os
import random
import time
from datetime import datetime, timezone
from kafka import KafkaProducer
import pandas as pd

# --- Configuración ---
KAFKA_BROKER_URL = os.getenv("KAFKA_BROKER_URL", "localhost:9092")
TOPIC_NAME = "datos_soterrado"
DATA_DIRECTORY = "datos_sensores/soterrado"
DELAY_SECONDS = 2
LOOP_DATA = True

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger("ProductorSoterrado")

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

# --- Cargar datos CSV o generar aleatorios ---
def cargar_datos():
    if not os.path.exists(DATA_DIRECTORY):
        logger.warning(f"No se encontró el directorio {DATA_DIRECTORY}. Se usarán datos simulados.")
        return []

    archivos = [os.path.join(DATA_DIRECTORY, f) for f in os.listdir(DATA_DIRECTORY) if f.endswith(".csv")]
    if not archivos:
        logger.warning("No se encontraron CSVs. Se usarán datos simulados.")
        return []

    df = pd.concat([pd.read_csv(f) for f in archivos], ignore_index=True)
    df["time"] = pd.to_datetime(df["time"], errors="coerce")
    df = df.sort_values("time").reset_index(drop=True)
    desfase = datetime.now(timezone.utc) - df["time"].iloc[0].replace(tzinfo=timezone.utc)
    df["time"] = df["time"].apply(lambda t: t.replace(tzinfo=timezone.utc) + desfase)
    return df.to_dict("records")

# --- Construir mensaje para Kafka ---
def construir_mensaje(registro):
    mensaje = {
        "time": registro.get("time", datetime.now(timezone.utc).isoformat()),
        "deviceInfo": {"deviceName": registro.get("deviceName", "Sensor_Soterrado")},
        "object": {
            "vibration": float(registro.get("vibration", 0)),
            "moisture": float(registro.get("moisture", 0)),
            "methane": float(registro.get("methane", 0)),
            "temperature": float(registro.get("temperature", 0)),
            "status": registro.get("status", "OK"),
        },
    }
    return mensaje

# --- Generar datos aleatorios (simulados) ---
def generar_dato_aleatorio():
    vibracion = round(random.uniform(0, 100), 2)           # Hz
    humedad_suelo = round(random.uniform(20, 95), 2)       # %
    metano = round(random.uniform(0.0, 10.0), 2)           # ppm
    temperatura = round(random.uniform(10, 25), 2)         # °C

    if vibracion > 80 or metano > 7.5 or humedad_suelo > 90:
        estado = "ALERT"
    elif vibracion > 50 or metano > 5 or humedad_suelo > 75:
        estado = "WARNING"
    else:
        estado = "OK"

    return {
        "time": datetime.now(timezone.utc).isoformat(),
        "deviceInfo": {"deviceName": f"Sensor_Soterrado_{random.randint(1,3)}"},
        "object": {
            "vibration": vibracion,
            "moisture": humedad_suelo,
            "methane": metano,
            "temperature": temperatura,
            "status": estado
        },
    }

# --- Programa principal ---
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
                productor.flush()
                time.sleep(DELAY_SECONDS)
            if not LOOP_DATA:
                break
            time.sleep(5)
    except KeyboardInterrupt:
        logger.info("Productor detenido por el usuario.")
    finally:
        productor.close()

if __name__ == "__main__":
    main()
