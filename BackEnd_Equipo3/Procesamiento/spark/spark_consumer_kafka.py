from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType, DoubleType

spark = SparkSession.builder \
    .appName("KafkaSparkConsumer") \
    .master("spark://spark-master:7077") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

schema = StructType() \
    .add("time", StringType()) \
    .add("deviceInfo", StructType().add("deviceName", StringType())) \
    .add("object", StructType()
         .add("temperature", DoubleType())
         .add("humidity", DoubleType())
         .add("co2", DoubleType())
         .add("pressure", DoubleType())
         .add("laeq", DoubleType())
         .add("lai", DoubleType())
         .add("laiMax", DoubleType())
         .add("battery", DoubleType())
         .add("status", StringType())
         .add("vibration", DoubleType())
         .add("moisture", DoubleType())
         .add("methane", DoubleType())
        )

raw = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "datos_calidad_aire,datos_sonido,datos_soterrado") \
    .option("startingOffsets", "latest") \
    .load()

df = raw.selectExpr("CAST(value AS STRING) as json") \
        .select(from_json(col("json"), schema).alias("data")) \
        .select("data.*")

q = df.writeStream.outputMode("append").format("console").start()
q.awaitTermination()
