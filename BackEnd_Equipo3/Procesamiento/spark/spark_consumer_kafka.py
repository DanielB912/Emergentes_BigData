from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import *

# =======================================================
# ESQUEMA CORRECTO PARA LOS 3 PRODUCTORES
# =======================================================
schema = StructType([
    StructField("time", StringType()),
    StructField("deviceInfo", StructType([
        StructField("deviceName", StringType())
    ])),
    StructField("object", StructType([
        StructField("temperature", DoubleType()),
        StructField("humidity", DoubleType()),
        StructField("co2", DoubleType()),
        StructField("pressure", DoubleType()),
        StructField("laeq", DoubleType()),
        StructField("lai", DoubleType()),
        StructField("laiMax", DoubleType()),
        StructField("battery", DoubleType()),
        StructField("status", StringType()),
        StructField("vibration", DoubleType()),
        StructField("moisture", DoubleType()),
        StructField("methane", DoubleType())
    ])),
])

# =======================================================
# SESIÓN SPARK
# =======================================================
spark = SparkSession.builder.appName("KafkaConsumer").getOrCreate()

# =======================================================
# LECTURA DESDE KAFKA
# =======================================================
raw = spark.readStream.format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "datos_soterrado,datos_sonido,datos_calidad_aire") \
    .option("startingOffsets", "latest") \
    .load()

# 1) JSON en bruto (tal como llega de Kafka)
raw_json = raw.selectExpr("CAST(value AS STRING) AS raw_json")

# 2) Parseo del JSON con el esquema
parsed = raw_json.select(from_json(col("raw_json"), schema).alias("data"))

# 3) Selección de campos limpios
clean = parsed.select(
    "data.time",
    "data.deviceInfo",
    "data.object"
)

# =======================================================
# SALIDA EN CONSOLA
# =======================================================

# Mostrar el JSON en bruto (para debug)
raw_query = raw_json.writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", "false") \
    .start()

# Mostrar el JSON parseado (para análisis)
parsed_query = clean.writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", "false") \
    .start()

spark.streams.awaitAnyTermination()
