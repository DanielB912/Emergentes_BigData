from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import *
import psycopg2
from psycopg2 import sql
from pymongo import MongoClient
from datetime import datetime
import traceback
from bson.objectid import ObjectId
# =======================================================
# ESQUEMA PARA TODOS LOS SENSORES
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


# SESIÓN SPARK  

spark = SparkSession.builder.appName("KafkaConsumer").getOrCreate()


# LECTURA DESDE KAFKA  

raw = spark.readStream.format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "datos_soterrado,datos_sonido,datos_calidad_aire") \
    .option("startingOffsets", "latest") \
    .load()

# 1) JSON en string
raw_json = raw.selectExpr("CAST(value AS STRING) AS raw_json")

# 2) Parseo del JSON
parsed = raw_json.select(from_json(col("raw_json"), schema).alias("data"))

# 3) Selección limpia
clean = parsed.select(
    "data.time",
    "data.deviceInfo",
    "data.object"
)


# FUNCIONES PARA INSERTAR EN BDs 

PG_HOST = "postgres_iot"
PG_PORT = 5432
PG_DB = "SensoresIoT"
PG_USER = "postgres"
PG_PASS = "12345"

MONGO_HOST = "mongo_iot"
MONGO_PORT = 27017
MONGO_DB = "sensores_iot"


def detect_sensor_type(device_name: str):
    if not device_name:
        return None
    d = device_name.lower()
    if d.startswith("sensor_aire"):
        return "aire"
    if d.startswith("sensor_sonido"):
        return "sonido"
    if d.startswith("sensor_soterrado"):
        return "soterrado"
    return None


def ensure_sensor_pg(cur, device_name, tipo_sensor):
    insert_q = """
        INSERT INTO sensor (device_name, tipo_sensor)
        VALUES (%s, %s)
        ON CONFLICT (device_name) DO NOTHING
        RETURNING sensor_id;
    """
    cur.execute(insert_q, (device_name, tipo_sensor))
    row = cur.fetchone()

    if row is not None:
        return row[0]

    cur.execute("SELECT sensor_id FROM sensor WHERE device_name = %s;", (device_name,))
    return cur.fetchone()[0]


def insert_measure_pg(cur, tipo, sensor_id, fecha_hora, obj):
    if tipo == "aire":
        cur.execute("""
            INSERT INTO sensor_aire (sensor_id, fecha_hora, temperature, humidity, co2, pressure)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            sensor_id, fecha_hora,
            obj.get("temperature"),
            obj.get("humidity"),
            obj.get("co2"),
            obj.get("pressure")
        ))

    elif tipo == "sonido":
        cur.execute("""
            INSERT INTO sensor_sonido (sensor_id, fecha_hora, laeq, lai, laimax, battery, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            sensor_id, fecha_hora,
            obj.get("laeq"),
            obj.get("lai"),
            obj.get("laiMax"),
            obj.get("battery"),
            obj.get("status")
        ))

    elif tipo == "soterrado":
        cur.execute("""
            INSERT INTO sensor_soterrado (sensor_id, fecha_hora, vibration, moisture, methane, temperature, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            sensor_id, fecha_hora,
            obj.get("vibration"),
            obj.get("moisture"),
            obj.get("methane"),
            obj.get("temperature"),
            obj.get("status")
        ))

def ensure_sensor_mongo(mongo_db, device_name, sensor_type):
    existing = mongo_db["sensor"].find_one({"device_name": device_name})
    if existing:
        return existing["_id"]

    doc = {
        "device_name": device_name,
        "tipo_sensor": sensor_type,
        "creado_en": datetime.utcnow()
    }
    result = mongo_db["sensor"].insert_one(doc)
    return result.inserted_id


def foreach_batch_insert(batch_df, batch_id):
    if batch_df.rdd.isEmpty():
        return

    print(f"[Batch {batch_id}] Procesando...")

    # Conexiones
    pg_conn = psycopg2.connect(
        host=PG_HOST, port=PG_PORT, dbname=PG_DB,
        user=PG_USER, password=PG_PASS
    )
    pg_conn.autocommit = False
    pg_cur = pg_conn.cursor()

    mongo_client = MongoClient(MONGO_HOST, MONGO_PORT)
    mongo_db = mongo_client[MONGO_DB]

    for row in batch_df.toLocalIterator():
        try:
            time_str = row["time"]
            deviceInfo = row["deviceInfo"]
            obj = row["object"]

            if deviceInfo is None or deviceInfo.deviceName is None:
                print("Fila ignorada: deviceName NULL")
                continue

            device_name = deviceInfo.deviceName
            sensor_type = detect_sensor_type(device_name)

            if sensor_type is None:
                print("Tipo de sensor desconocido:", device_name)
                continue

            fecha_hora = datetime.fromisoformat(time_str.split("+")[0])

            obj_dict = {k: getattr(obj, k) for k in obj.__fields__}

            # 1) Crear/obtener sensor en Mongo
            mongo_sensor_id = ensure_sensor_mongo(mongo_db, device_name, sensor_type.capitalize())

            # 2) Crear/obtener sensor en PostgreSQL
            pg_sensor_id = ensure_sensor_pg(pg_cur, device_name, sensor_type.capitalize())

            # 3) Insertar medición en PostgreSQL usando INT
            insert_measure_pg(pg_cur, sensor_type, pg_sensor_id, fecha_hora, obj_dict)

            # 4) Insertar medición en Mongo usando ObjectID
            mongo_db[f"sensor_{sensor_type}"].insert_one({
                "sensor_mongo_id": mongo_sensor_id,
                "sensor_pg_id": pg_sensor_id,
                "device_name": device_name,
                "time": time_str,
                "object": obj_dict,
                "inserted_at": datetime.utcnow()
            })


        except Exception as e:
            print("ERROR fila:", e)
            traceback.print_exc()
            continue

    pg_conn.commit()
    pg_conn.close()
    mongo_client.close()


# STREAM HACIA BASES DE DATOS 

stream_to_db = clean.writeStream \
    .outputMode("append") \
    .foreachBatch(foreach_batch_insert) \
    .start()


# STREAM ORIGINAL A CONSOLA 

console_stream = clean.writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", "false") \
    .start()

spark.streams.awaitAnyTermination()
