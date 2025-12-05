Consumidores Kafka – Capa de Ingestión

Este módulo contiene los scripts responsables de leer y procesar los mensajes enviados por los productores Kafka de la capa de Fuente de Datos.

Actualmente existen 4 consumidores:

✅ 1. consumidor_calidad_aire.py

Lee los mensajes provenientes del topic:

datos_calidad_aire


Ejecutar:

python consumidor_calidad_aire.py

✅ 2. consumidor_sonido.py

Lee los mensajes del topic:

datos_sonido


Ejecutar:

python consumidor_sonido.py

✅ 3. consumidor_soterrado.py

Lee los mensajes del topic:

datos_soterrado


Ejecutar:

python consumidor_soterrado.py

🚀 4. consumidor_multitopics.py

Este consumidor escucha todos los topics simultáneamente:

datos_calidad_aire
datos_sonido
datos_soterrado


Permite visualizar todos los datos que ingresan a Kafka desde un solo script.

Ejecutar:

python consumidor_multitopics.py


Ejemplo de salida:

📌 Topic: datos_sonido
{
  "time": "...",
  "deviceInfo": {
    "deviceName": "Sensor_Sonido_3"
  },
  "object": {
    "laeq": 74.5,
    "lai": 63.1,
    "laiMax": 101.2,
    "battery": 88,
    "status": "OK"
  }
}
------------------------------------------------------------

💡 Requisitos

Antes de ejecutar cualquier consumidor:

Iniciar Kafka y Zookeeper

docker-compose up -d


Verificar que los topics existen

docker exec kafka bash -c "/usr/bin/kafka-topics --list --bootstrap-server localhost:9092"


Ejecutar un productor correspondiente (aire, sonido o soterrado)

Solo entonces los consumidores empezarán a mostrar mensajes.

📌 Notas

Cada consumidor usa un group_id distinto → no interfieren entre ellos.

El consumidor múltiple es ideal para debugging cuando hay varios productores simultáneos.

Estos scripts serán reemplazados posteriormente por Spark Structured Streaming, pero se mantienen para pruebas locales.