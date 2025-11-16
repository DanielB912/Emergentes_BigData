# 📡 Proyecto Big Data – Kafka + Spark Streaming + Simuladores de Sensores

Este proyecto implementa un pipeline de Big Data donde:

- Sensores simulados (aire, sonido, soterrado) envían datos en JSON.
- Los datos se publican en Kafka en 3 topics.
- Spark Structured Streaming consume los mensajes en tiempo real usando `spark-submit`.

---

# 🚀 1. Requisitos previos

### ✔ Docker Desktop  
### ✔ Python 3.10+  
### ✔ Librerías Python necesarias

```bash
pip install kafka-python pandas pyspark
📦 2. Estructura del Proyecto
markdown
Copiar código
BackEnd_Equipo3/
│
├── datos_sensores/
│   ├── calidad_aire/
│   ├── sonido/
│   └── soterrado/
│
├── kafka-docker/
│   └── docker-compose.yml   → Kafka + Zookeeper
│
├── Procesamiento/
│   ├── docker-compose.yml   → Spark Master + Workers + Spark-submit
│   ├── Dockerfile.spark
│   ├── spark/
│   │   └── spark_consumer_kafka.py  ← CONSUMIDOR REAL
│   └── docs
│
└── producers/
    ├── productor_calidad_aire.py
    ├── productor_sonido.py
    └── productor_soterrado.py
🟦 3. Levantar Kafka
bash
Copiar código
cd BackEnd_Equipo3/kafka-docker
docker-compose up -d
Verificar:

bash
Copiar código
docker ps
Crear los topics (una sola vez):

bash
Copiar código
docker exec kafka bash -c "/usr/bin/kafka-topics --create --topic datos_calidad_aire --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1"
docker exec kafka bash -c "/usr.bin/kafka-topics --create --topic datos_sonido --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1"
docker exec kafka bash -c "/usr.bin/kafka-topics --create --topic datos_soterrado --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1"
🔧 4. Levantar Spark (Master + Workers + Spark-submit)
Crear la red externa (solo una vez):

bash
Copiar código
docker network create bigdata_net
Levantar Spark:

bash
Copiar código
cd BackEnd_Equipo3/Procesamiento
docker-compose up -d --build
Interfaces disponibles:

Master UI → http://localhost:8080

Workers UI → http://localhost:8081 y http://localhost:8082

📈 5. Ejecutar los productores Python (simular sensores)
En 3 terminales separados:

bash
Copiar código
cd BackEnd_Equipo3/producers
python productor_calidad_aire.py
python productor_sonido.py
python productor_soterrado.py
🔥 6. Ejecutar el Consumidor Spark (REAL)
Este es el paso CORRECTO que hemos usado:

Entrar al contenedor spark-submit:
bash
Copiar código
docker exec -it spark-submit bash
Ejecutar Spark Streaming con Kafka:
bash
Copiar código
spark-submit \
  --master spark://spark-master:7077 \
  --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1 \
  spark_consumer_kafka.py
Deberías ver:

markdown
Copiar código
-----------------------------------------
Batch: 32
-----------------------------------------
| time | deviceInfo | object |
Cada batch contiene los datos de los sensores que llegan de Kafka.