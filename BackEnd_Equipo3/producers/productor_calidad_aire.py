import json
import logging
import os
import random
import time
from datetime import datetime, timezone
import pandas as pd
from kafka import KafkaProducer

# --- Configuración ---
<<<<<<< HEAD
KAFKA_BOOTSTRAP = "kafka:9092"
TOPIC_NAME = "datos_calidad_aire"
DATA_DIRECTORY = "/app/producers/datos_sensores/calidad_aire"   # ruta absoluta dentro del contenedor
=======
KAFKA_BROKER_URL = os.getenv("KAFKA_BROKER_URL", "localhost:9092")
TOPIC_NAME = "datos_calidad_aire"
DATA_DIRECTORY = "datos_sensores/calidad_aire"
>>>>>>> dev
DELAY_SECONDS = 2
LOOP_DATA = True

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger("ProductorCalidadAire")

# --- Crear productor Kafka ---
def crear_productor():
    try:
        return KafkaProducer(
<<<<<<< HEAD
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
        logger.warning("⚠ No hay CSV, usando datos simulados.")
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
        logger.warning("⚠ CSV no tiene columna 'time', usando ahora()")
        df["time"] = datetime.now(timezone.utc).isoformat()

    return df.to_dict("records")

# --- Construir mensaje ---
def construir_mensaje(registro):
    return {
        "time": str(registro.get("time", datetime.now(timezone.utc).isoformat())),
        "deviceInfo": { "deviceName": registro.get("deviceName", "sensor_aire_1") },
        "object": {
            "temperature": float(registro.get("temperature", random.uniform(18, 32))),
            "humidity": float(registro.get("humidity", random.uniform(40, 75))),
            "co2": float(registro.get("co2", random.uniform(400, 1500))),
            "pressure": float(registro.get("pressure", random.uniform(1010, 1025))),
        }
    }

# --- Dato aleatorio ---
def generar_dato_aleatorio():
    return {
        "time": datetime.now(timezone.utc).isoformat(),
        "deviceInfo": { "deviceName": f"sensor_aire_{random.randint(1,3)}" },
=======
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

def construir_mensaje(registro):
    mensaje = {
        "time": datetime.now(timezone.utc).isoformat(),
        "deviceInfo": {"deviceName": registro.get("deviceInfo.deviceName", "Sensor_Aire")},
        "object": {}
    }
    for campo in ["object.temperature", "object.humidity", "object.co2", "object.pressure"]:
        valor = registro.get(campo)
        if pd.notna(valor):
            mensaje["object"][campo.split(".")[1]] = float(valor)
    return mensaje

def generar_dato_aleatorio():
    return {
        "time": datetime.now(timezone.utc).isoformat(),
        "deviceInfo": {"deviceName": f"Sensor_Aire_{random.randint(1,3)}"},
>>>>>>> dev
        "object": {
            "temperature": round(random.uniform(18, 32), 2),
            "humidity": round(random.uniform(40, 75), 2),
            "co2": random.randint(400, 1500),
            "pressure": round(random.uniform(1010, 1025), 2),
        },
    }

<<<<<<< HEAD
# --- Ejecución principal ---
=======
>>>>>>> dev
def main():
    productor = crear_productor()
    if not productor:
        return
<<<<<<< HEAD

    datos = cargar_datos()
    logger.info(f"🚀 Enviando datos al topic '{TOPIC_NAME}'")
=======
    datos = cargar_datos()
    logger.info(f"Iniciando envío al topic {TOPIC_NAME}")
>>>>>>> dev

    try:
        while True:
            if not datos:
                datos = [generar_dato_aleatorio()]
<<<<<<< HEAD

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
>>>>>>> dev
    finally:
        productor.close()

if __name__ == "__main__":
    main()
