🧠 Guía de Configuración — Kafka + Productores Python

Este documento explica paso a paso cómo levantar el entorno Kafka localmente usando Docker y enviar datos desde productores Python hacia distintos topics.

🚀 1. Requisitos previos

Asegúrate de tener instalado:

Docker Desktop

Python 3.11 o superior

Librerías Python necesarias:

pip install kafka-python pandas

⚙️ 2. Levantar el entorno Kafka

Desde la carpeta kafka-docker, ejecuta:

docker-compose up -d


Verifica que ambos contenedores estén activos:

docker ps


Deberías ver algo como:

CONTAINER ID   IMAGE                             STATUS
xxxxxx          confluentinc/cp-zookeeper:7.6.1   Up ...
xxxxxx          confluentinc/cp-kafka:7.6.1       Up ...

🧩 3. Crear los topics

Crea los tres topics desde PowerShell:

docker exec kafka bash -c "/usr/bin/kafka-topics --create --topic datos_calidad_aire --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1"

docker exec kafka bash -c "/usr/bin/kafka-topics --create --topic datos_sonido --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1"

docker exec kafka bash -c "/usr/bin/kafka-topics --create --topic datos_soterrado --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1"


Verifica la lista:

docker exec kafka bash -c "/usr/bin/kafka-topics --list --bootstrap-server localhost:9092"

🧠 4. Ejecutar los productores Python

Desde la raíz del proyecto:

python BackEnd_Equipo3\producers\productor_calidad_aire.py
python BackEnd_Equipo3\producers\productor_sonido.py
python BackEnd_Equipo3\producers\productor_soterrado.py


Cada uno enviará datos al topic correspondiente.

📡 5. Ver mensajes desde Kafka (consumidor nativo)

Para ver los mensajes emitidos por cada productor:

docker exec kafka bash -c "/usr/bin/kafka-console-consumer --bootstrap-server localhost:9092 --topic datos_calidad_aire --from-beginning"


(Reemplaza el nombre del topic según el que quieras leer)

🧱 6. Arquitectura del flujo
(Productores Python) → Kafka Topics → (Spark Streaming o BD)


Próximamente estos mensajes podrán ser procesados por Spark o almacenados en MongoDB/MySQL.

✅ 7. Apagar los contenedores

Cuando termines de trabajar:

docker-compose down