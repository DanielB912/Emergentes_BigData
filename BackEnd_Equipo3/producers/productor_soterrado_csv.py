import json
import logging
import os
import random
import time
from kafka import KafkaProducer
import pandas as pd

# --- Configuración ---
KAFKA_BROKER_URL = os.getenv("KAFKA_BROKER_URL", "localhost:9092")
TOPIC_NAME = "datos_soterrado"

# Ruta real donde guardaste los CSV
DATA_DIRECTORY = r"C:/datosBigData/datos_soterrado"

# Tamaño máximo del lote antes de fragmentar (en cantidad de filas)
BATCH_SIZE = 500  

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


# --- Cargar CSVs ---
def cargar_datos_desde_csv():
    if not os.path.exists(DATA_DIRECTORY):
        logger.warning(f"No existe el directorio {DATA_DIRECTORY}. Se usarán datos simulados.")
        return []

    archivos = [
        os.path.join(DATA_DIRECTORY, f)
        for f in os.listdir(DATA_DIRECTORY)
        if f.endswith(".csv")
    ]

    if not archivos:
        logger.warning("No se encontraron CSVs. Se usarán datos simulados.")
        return []

    df = pd.concat([pd.read_csv(f) for f in archivos], ignore_index=True)

    # Convertimos automáticamente columnas de tiempo si existen
    if "time" in df.columns:
        df["time"] = pd.to_datetime(df["time"], errors="ignore")

    # Convertimos DataFrame → lista de diccionarios
    return df.to_dict("records")


# --- Construcción del mensaje ---
def construir_mensaje(registro):
    """Solo toma las columnas necesarias si existen."""
    return {
        "time": registro.get("time", None),
        "deviceInfo": {
            "deviceName": registro.get("deviceInfo.deviceName", "Sensor_Soterrado")
        },
        "object": {
            "vibration": registro.get("object.vibration"),
            "moisture": registro.get("object.moisture"),
            "methane": registro.get("object.methane"),
            "temperature": registro.get("object.temperature"),
            "status": registro.get("object.status"),
        }
    }


# --- Generar dato aleatorio (fallback) ---
def generar_dato_aleatorio():
    vibracion = round(random.uniform(0, 100), 2)
    humedad_suelo = round(random.uniform(20, 95), 2)
    metano = round(random.uniform(0.0, 10.0), 2)
    temperatura = round(random.uniform(10, 25), 2)

    if vibracion > 80 or metano > 7.5 or humedad_suelo > 90:
        estado = "ALERT"
    elif vibracion > 50 or metano > 5 or humedad_suelo > 75:
        estado = "WARNING"
    else:
        estado = "OK"

    return {
        "time": pd.Timestamp.now().isoformat(),
        "deviceInfo": {"deviceName": f"Sensor_Soterrado_{random.randint(1, 3)}"},
        "object": {
            "vibration": vibracion,
            "moisture": humedad_suelo,
            "methane": metano,
            "temperature": temperatura,
            "status": estado,
        },
    }


# --- Envío de datos ---
def main():
    productor = crear_productor()
    if not productor:
        return

    datos = cargar_datos_desde_csv()
    logger.info(f"Iniciando envío al topic {TOPIC_NAME}")

    try:
        # Si hay CSV → enviamos todo
        if datos:
            logger.info(f"Enviando {len(datos)} registros desde CSV...")

            # Si son pocos → mandar de golpe
            if len(datos) <= BATCH_SIZE:
                for registro in datos:
                    mensaje = construir_mensaje(registro)
                    productor.send(TOPIC_NAME, value=mensaje)
                productor.flush()
                logger.info("✔ Envío completo desde CSV")
                return

            # Si son muchos → enviar por lotes
            logger.info("Datos grandes detectados, enviando por lotes...")
            for i in range(0, len(datos), BATCH_SIZE):
                lote = datos[i:i + BATCH_SIZE]
                for registro in lote:
                    mensaje = construir_mensaje(registro)
                    productor.send(TOPIC_NAME, value=mensaje)
                productor.flush()
                logger.info(f"✔ Enviado lote {i//BATCH_SIZE + 1}")

            return

        # Si NO hay CSV, enviar datos aleatorios cada 2s
        logger.warning("Sin CSV → Enviando datos simulados cada 2 segundos...")
        while True:
            mensaje = generar_dato_aleatorio()
            productor.send(TOPIC_NAME, value=mensaje)
            logger.info(f"Enviado: {mensaje}")
            productor.flush()
            time.sleep(2)

    except KeyboardInterrupt:
        logger.info("Productor detenido por el usuario.")
    finally:
        productor.close()


if __name__ == "__main__":
    main()
