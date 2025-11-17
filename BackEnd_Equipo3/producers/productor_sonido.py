import json
import logging
import os
import random
import time
from datetime import datetime, timezone
<<<<<<< HEAD
import pandas as pd
from kafka import KafkaProducer

# --- Configuración ---
KAFKA_BOOTSTRAP = "kafka:9092"
TOPIC_NAME = "datos_sonido"
DATA_DIRECTORY = "/app/producers/datos_sensores/sonido"
=======
from kafka import KafkaProducer
import pandas as pd

# --- Configuración ---
KAFKA_BROKER_URL = os.getenv("KAFKA_BROKER_URL", "localhost:9092")
TOPIC_NAME = "datos_sonido"
DATA_DIRECTORY = "datos_sensores/sonido"
>>>>>>> dev
DELAY_SECONDS = 2
LOOP_DATA = True

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger("ProductorSonido")

<<<<<<< HEAD
# --- Crear productor Kafka ---
def crear_productor():
    try:
        return KafkaProducer(
            bootstrap_servers=[KAFKA_BOOTSTRAP],
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            retries=5
        )
    except Exception as e:
        logger.error(f"❌ Error conectando con Kafka: {e}")
        return None

# --- Cargar CSV ---
def cargar_datos():
    if not os.path.exists(DATA_DIRECTORY):
        logger.warning(f"⚠ No se encontró {DATA_DIRECTORY}, usando datos simulados.")
        return []

    archivos = [
        os.path.join(DATA_DIRECTORY, f)
        for f in os.listdir(DATA_DIRECTORY)
        if f.endswith(".csv")
    ]

    if not archivos:
        logger.warning("⚠ No hay CSV de sonido, usando datos simulados.")
        return []

    try:
        df = pd.concat([pd.read_csv(f) for f in archivos], ignore_index=True)
    except Exception as e:
        logger.error(f"❌ Error leyendo CSV: {e}")
        return []

    if "time" in df.columns:
        df["time"] = pd.to_datetime(df["time"], errors="coerce")
        df = df.dropna(subset=["time"])
        df = df.sort_values("time").reset_index(drop=True)

        desfase = datetime.now(timezone.utc) - df["time"].iloc[0].replace(tzinfo=timezone.utc)
        df["time"] = df["time"].apply(lambda t: t.replace(tzinfo=timezone.utc) + desfase)
    else:
        logger.warning("⚠ CSV sin columna 'time', usando ahora()")
        df["time"] = datetime.now(timezone.utc).isoformat()

    return df.to_dict("records")

# --- Construir mensaje ---
def construir_mensaje(registro):
    return {
        "time": str(registro.get("time", datetime.now(timezone.utc).isoformat())),
        "deviceInfo": {
            "deviceName": registro.get("deviceName", f"sensor_sonido_{random.randint(1,3)}")
        },
        "object": {
            "laeq": float(registro.get("laeq", random.uniform(40, 90))),
            "lai": float(registro.get("lai", random.uniform(30, 80))),
            "laiMax": float(registro.get("laiMax", random.uniform(60, 100))),
            "battery": float(registro.get("battery", random.uniform(10, 100))),
            "status": registro.get("status", "OK")
        }
    }

# --- Dato aleatorio ---
def generar_dato_aleatorio():
    return {
        "time": datetime.now(timezone.utc).isoformat(),
        "deviceInfo": {"deviceName": f"sensor_sonido_{random.randint(1,3)}"},
        "object": {
            "laeq": round(random.uniform(40, 90), 2),
            "lai": round(random.uniform(30, 80), 2),
            "laiMax": round(random.uniform(60, 100), 2),
            "battery": random.randint(10, 100),
            "status": "OK",
        },
    }

# --- Main ---
=======
def crear_productor():
    try:
        return KafkaProducer(
            bootstrap_servers=[KAFKA_BROKER_URL],
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
    except Exception as e:
        logger.error(f"Error conectando con Kafka: {e}")
        return None

def generar_dato_aleatorio():
    return {
        "time": datetime.now(timezone.utc).isoformat(),
        "deviceInfo": {"deviceName": f"Sensor_Sonido_{random.randint(1,5)}"},
        "object": {
            "laeq": round(random.uniform(40, 95), 2),       # Nivel instantáneo de ruido (dB)
            "lai": round(random.uniform(30, 80), 2),        # Nivel promedio (dB)
            "laiMax": round(random.uniform(70, 110), 2),    # Pico máximo (dB)
            "battery": random.randint(60, 100),             # Nivel batería (%)
            "status": random.choice(["OK", "HIGH", "CRITICAL"])
        },
    }

>>>>>>> dev
def main():
    productor = crear_productor()
    if not productor:
        return
<<<<<<< HEAD

    datos = cargar_datos()
    logger.info(f"🚀 Enviando datos al topic '{TOPIC_NAME}'")

    try:
        while True:
            if not datos:
                datos = [generar_dato_aleatorio()]

            for registro in datos:
                mensaje = construir_mensaje(registro)
                productor.send(TOPIC_NAME, value=mensaje)
                logger.info(f"📤 Enviado: {mensaje}")
                time.sleep(DELAY_SECONDS)

            if not LOOP_DATA:
                break

    except KeyboardInterrupt:
        logger.info("🛑 Productor detenido por el usuario.")
=======
    logger.info(f"Iniciando envío de datos al topic {TOPIC_NAME}")
    try:
        while True:
            mensaje = generar_dato_aleatorio()
            productor.send(TOPIC_NAME, value=mensaje)
            logger.info(f"Enviado: {mensaje}")
            productor.flush()
            time.sleep(DELAY_SECONDS)
    except KeyboardInterrupt:
        logger.info("Productor detenido por el usuario.")
>>>>>>> dev
    finally:
        productor.close()

if __name__ == "__main__":
    main()
