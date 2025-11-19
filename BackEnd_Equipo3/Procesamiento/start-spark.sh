#!/bin/bash

echo "🔥 Iniciando contenedor SPARK con modo: $SPARK_MODE"

if [ "$SPARK_MODE" = "master" ]; then
    echo "🔥 Iniciando Spark Master..."
    $SPARK_HOME/sbin/start-master.sh
    tail -f /dev/null
elif [ "$SPARK_MODE" = "worker" ]; then
    echo "🔥 Iniciando Spark Worker conectado a: $SPARK_MASTER_URL"
    $SPARK_HOME/sbin/start-worker.sh $SPARK_MASTER_URL
    tail -f /dev/null
elif [ "$SPARK_MODE" = "submit" ]; then
    echo "🔥 Esperando 10 segundos para que Kafka y la BD inicien..."
    sleep 10

    echo "🔥 Ejecutando el consumer Kafka → spark_consumer_kafka.py"
    $SPARK_HOME/bin/spark-submit \
        --master $SPARK_MASTER_URL \
        --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1 \
        /opt/spark-apps/spark_consumer_kafka.py

    tail -f /dev/null
else
    echo "⚠️ SPARK_MODE no reconocido: $SPARK_MODE"
    tail -f /dev/null
fi
