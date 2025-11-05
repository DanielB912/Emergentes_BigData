from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, schema_of_json
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType
import time

# Inicializa SparkSession
spark = SparkSession.builder \
    .appName("ETL_Simulacion_Sensores") \
    .master("spark://spark-master:7077") \
    .config("spark.jars.packages", "org.postgresql:postgresql:42.6.0") \
    .getOrCreate()

print("✅ Spark inicializado correctamente")

# Simula un flujo de datos (en vez de Kafka)
data = [
    ("sensor-A", "2025-11-05 05:10:00", 25.3, 60.1, 55.0),
    ("sensor-B", "2025-11-05 05:11:00", 27.1, 59.4, 53.5),
    ("sensor-C", "2025-11-05 05:12:00", 23.8, 61.2, 56.8)
]

schema = StructType([
    StructField("sensor_id", StringType(), True),
    StructField("timestamp", StringType(), True),
    StructField("temperatura", DoubleType(), True),
    StructField("humedad", DoubleType(), True),
    StructField("ruido", DoubleType(), True)
])

df = spark.createDataFrame(data, schema)
df = df.withColumn("timestamp", col("timestamp").cast(TimestampType()))

print("✅ Datos simulados cargados en DataFrame")
df.show()

# Configura conexión a Postgres
jdbc_url = "jdbc:postgresql://pg:5432/gamc"
connection_properties = {
    "user": "postgres",
    "password": "postgres",
    "driver": "org.postgresql.Driver"
}

# Escribe el resultado a la tabla
df.write.jdbc(
    url=jdbc_url,
    table="events_flat",
    mode="append",
    properties=connection_properties
)

print("✅ Datos insertados exitosamente en PostgreSQL")

spark.stop()
