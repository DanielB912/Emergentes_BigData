#!/bin/bash
KAFKA_HOST=kafka
KAFKA_PORT=9092

echo "⏳ Esperando a Kafka ($KAFKA_HOST:$KAFKA_PORT)..."

while ! nc -z $KAFKA_HOST $KAFKA_PORT; do
    sleep 1
done

echo "✅ Kafka está disponible. Iniciando producers..."
python /app/producers/productor_calidad_aire.py &
python /app/producers/productor_soterrado.py &
python /app/producers/productor_sonido.py &
wait
