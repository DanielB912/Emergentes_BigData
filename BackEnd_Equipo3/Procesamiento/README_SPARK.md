\# 🧩 Proyecto Big Data – Kafka + Spark + Productores Python



Este entorno permite simular flujos de datos IoT usando \*\*Kafka\*\* como broker de mensajería, \*\*Spark Structured Streaming\*\* como consumidor en tiempo real y \*\*PostgreSQL\*\* como base de datos de destino.  

Incluye tres productores en Python que generan datos para diferentes tópicos.



---



\## 📂 Estructura del Proyecto



Emergentes\_BigData/

│

├─ BackEnd\_Equipo3/

│ ├─ kafka-docker/ # Docker Compose para Kafka + Zookeeper

│ │ └─ docker-compose.yml

│ │

│ ├─ Procesamiento/ # Docker Compose para Spark + Postgres

│ │ ├─ docker-compose.yml

│ │ ├─ Dockerfile.spark

│ │ └─ spark/

│ │ └─ spark\_consumer\_kafka.py

│ │

│ ├─ producers/ # Productores Python (sensores simulados)

│ │ ├─ productor\_calidad\_aire.py

│ │ ├─ productor\_sonido.py

│ │ └─ productor\_soterrado.py

│ │

│ └─ datos\_sensores/

│ ├─ calidad\_aire/

│ ├─ sonido/

│ └─ soterrado/



yaml

Copiar código



---



\## 🚀 1. Requisitos Previos



Asegúrate de tener instalado:



\- \[Docker Desktop](https://www.docker.com/products/docker-desktop/)

\- \[Python 3.11+](https://www.python.org/downloads/)

\- Librerías necesarias:

&nbsp; ```bash

&nbsp; pip install kafka-python pandas pyspark

⚙️ 2. Crear Red Compartida

Permite que los contenedores de Kafka y Spark se comuniquen.



bash

Copiar código

docker network create bigdata\_net

🧱 3. Levantar Kafka y Zookeeper

Desde la carpeta:



bash

Copiar código

cd BackEnd\_Equipo3\\kafka-docker

docker-compose up -d

Verifica los contenedores:



bash

Copiar código

docker ps

Deberías ver zookeeper y kafka activos.



📡 Crear Topics

bash

Copiar código

docker exec kafka bash -c "/usr/bin/kafka-topics --create --topic datos\_calidad\_aire --bootstrap-server localhost:9093 --partitions 1 --replication-factor 1"

docker exec kafka bash -c "/usr/bin/kafka-topics --create --topic datos\_sonido --bootstrap-server localhost:9093 --partitions 1 --replication-factor 1"

docker exec kafka bash -c "/usr/bin/kafka-topics --create --topic datos\_soterrado --bootstrap-server localhost:9093 --partitions 1 --replication-factor 1"



docker exec kafka bash -c "/usr/bin/kafka-topics --list --bootstrap-server localhost:9093"

🐍 4. Ejecutar Productores Python

Cada productor envía datos simulados a su topic correspondiente.



Crear entorno virtual (opcional)

bash

Copiar código

cd C:\\Emergentes\_BigData

python -m venv .venv

.\\.venv\\Scripts\\Activate.ps1

pip install kafka-python pandas

Ejecutar productores

bash

Copiar código

\# Desde PowerShell (cada uno en una terminal aparte)

$env:KAFKA\_BROKER\_URL="localhost:9093"



python .\\BackEnd\_Equipo3\\producers\\productor\_calidad\_aire.py

python .\\BackEnd\_Equipo3\\producers\\productor\_sonido.py

python .\\BackEnd\_Equipo3\\producers\\productor\_soterrado.py

Verás en consola:



css

Copiar código

Enviado: {"time": "...", "deviceInfo": {...}, "object": {...}}

⚙️ 5. Levantar el Entorno Spark + Postgres

Desde la carpeta de procesamiento:



bash

Copiar código

cd BackEnd\_Equipo3\\Procesamiento

docker-compose up -d --build

Verifica contenedores:



bash

Copiar código

docker ps

Interfaces web:



Spark Master UI → http://localhost:8080



Spark Worker 1 UI → http://localhost:8081



🔥 6. Ejecutar el Consumidor Spark (lee de Kafka)

Entra al contenedor spark-submit:



bash

Copiar código

docker exec -it spark-submit bash

cd /opt/spark-apps

Ejecuta el consumidor:



bash

Copiar código

spark-submit \\

&nbsp; --master spark://spark-master:7077 \\

&nbsp; --packages org.apache.spark:spark-sql-kafka-0-10\_2.12:3.5.1 \\

&nbsp; spark\_consumer\_kafka.py

✅ Spark se conectará al broker kafka:9092 (listener interno)

y comenzará a mostrar los mensajes en tiempo real.



🗄️ 7. (Opcional) Guardar en PostgreSQL

Para almacenar los datos procesados:



En el archivo spark\_consumer\_kafka.py, reemplaza la salida en consola por:



python

Copiar código

def save\_to\_postgres(batch\_df, batch\_id):

&nbsp;   batch\_df.write \\

&nbsp;       .format("jdbc") \\

&nbsp;       .option("url", "jdbc:postgresql://pg:5432/gamc") \\

&nbsp;       .option("dbtable", "datos\_iot") \\

&nbsp;       .option("user", "postgres") \\

&nbsp;       .option("password", "postgres") \\

&nbsp;       .mode("append") \\

&nbsp;       .save()



query = df.writeStream \\

&nbsp;   .outputMode("append") \\

&nbsp;   .foreachBatch(save\_to\_postgres) \\

&nbsp;   .start()

🧠 8. Flujo Completo del Sistema

scss

Copiar código

&nbsp;  🐍 Productores Python (simulan sensores)

&nbsp;              │

&nbsp;              ▼

&nbsp;        📬 Apache Kafka (Topics)

&nbsp;              │

&nbsp;              ▼

&nbsp;     ⚙️ Apache Spark Streaming (Consumidor)

&nbsp;              │

&nbsp;              ▼

&nbsp;          🗄️ PostgreSQL (Almacenamiento)

✅ 9. Apagar el entorno

Cuando termines:



bash

Copiar código

\# En kafka-docker

docker-compose down



\# En procesamiento

docker-compose down

🧩 10. Recursos útiles

Apache Kafka Docs



Apache Spark Structured Streaming



PostgreSQL Docs



Confluent Kafka Images

