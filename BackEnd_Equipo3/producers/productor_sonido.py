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
TOPIC_NAME = "datos_sonido"
DATA_DIRECTORY = "datos_sensores/sonido"
DELAY_SECONDS = 2
LOOP_DATA = True

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger("ProductorSonido")

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

def main():
    productor = crear_productor()
    if not productor:
        return
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
    finally:
        productor.close()

if __name__ == "__main__":
    main()
