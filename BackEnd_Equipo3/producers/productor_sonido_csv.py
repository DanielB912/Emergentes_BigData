import json
import logging
import os
import pandas as pd
from kafka import KafkaProducer

# ============================
# CONFIGURACIÓN
# ============================

KAFKA_BROKER_URL = os.getenv("KAFKA_BROKER_URL", "localhost:9092")
TOPIC_NAME = "datos_sonido"

# Ruta ABSOLUTA donde guardaste tus CSV reales
DATA_DIRECTORY = r"C:\datosBigData\datos_sonido"

# Modo de envío: "lineal" = uno por uno | "batch" = por lotes
SEND_MODE = "lineal"
BATCH_SIZE = 500

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger("ProductorSonidoCSV")


# ============================
# KAFKA
# ============================

def crear_productor():
    try:
        producer = KafkaProducer(
            bootstrap_servers=[KAFKA_BROKER_URL],
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )
        return producer
    except Exception as e:
        logger.error(f"Error al conectar con Kafka: {e}")
        return None


# ============================
# LECTURA DE CSV
# ============================

def cargar_csv():
    if not os.path.exists(DATA_DIRECTORY):
        logger.error(f"No existe el directorio {DATA_DIRECTORY}")
        return None

    archivos = [
        os.path.join(DATA_DIRECTORY, f)
        for f in os.listdir(DATA_DIRECTORY)
        if f.endswith(".csv")
    ]

    if not archivos:
        logger.error("No se encontraron archivos CSV en la carpeta.")
        return None

    df = pd.concat([pd.read_csv(path) for path in archivos], ignore_index=True)
    return df


# ============================
# ENVÍO DE DATOS
# ============================

def enviar_lineal(df, producer):
    logger.info("📡 Enviando datos uno por uno…")

    for _, row in df.iterrows():
        msg = row.to_dict()
        producer.send(TOPIC_NAME, value=msg)
        logger.info(f"Enviado: {msg}")

    producer.flush()
    logger.info("✔ Envío lineal completado.")


def enviar_batch(df, producer):
    logger.info("📡 Enviando datos en LOTES…")

    total = len(df)
    for i in range(0, total, BATCH_SIZE):
        batch = df.iloc[i:i+BATCH_SIZE].to_dict("records")

        for msg in batch:
            producer.send(TOPIC_NAME, value=msg)

        producer.flush()
        logger.info(f"📤 Lote enviado [{i} – {i + len(batch)}]")

    logger.info("✔ Envío batch completado.")


# ============================
# MAIN
# ============================

def main():
    producer = crear_productor()
    if not producer:
        return

    df = cargar_csv()
    if df is None:
        return

    logger.info(f"📂 CSV cargado: {len(df)} registros encontrados")

    if SEND_MODE == "lineal":
        enviar_lineal(df, producer)
    elif SEND_MODE == "batch":
        enviar_batch(df, producer)
    else:
        logger.error("Modo inválido. Usa 'lineal' o 'batch'.")

    producer.close()


if __name__ == "__main__":
    main()
