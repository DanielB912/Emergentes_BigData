📥 Consumidores Kafka – Capa de Ingestión

Este módulo contiene los scripts responsables de leer y procesar los mensajes enviados por los productores Kafka de la capa de Fuente de Datos.

Incluye consumidores individuales para cada tipo de sensor y un consumidor unificado para debugging.

📌 Consumidores actuales
✅ 1. consumidor_calidad_aire.py

Lee mensajes del topic:

datos_calidad_aire


Ejecutar:

python consumidor_calidad_aire.py

✅ 2. consumidor_sonido.py

Lee mensajes del topic:

datos_sonido


Ejecutar:

python consumidor_sonido.py

✅ 3. consumidor_soterrado.py

Lee mensajes del topic:

datos_soterrado


Ejecutar:

python consumidor_soterrado.py

🚀 4. consumidor_multitopics.py

Este consumidor escucha los 3 topics simultáneamente:

datos_calidad_aire

datos_sonido

datos_soterrado

Ideal para debugging, cuando los 3 productores están enviando datos a la vez.

Ejecutar:

python consumidor_multitopics.py


Ejemplo de salida:

📌 Topic: datos_sonido
{
  "time": "2025-11-12T12:57:30.179151+00:00",
  "deviceInfo": { "deviceName": "Sensor_Sonido_3" },
  "object": {
    "laeq": 74.5,
    "lai": 63.1,
    "laiMax": 101.2,
    "battery": 88,
    "status": "OK"
  }
}
------------------------------------------------------------

🆕 Actualización importante (productores basados en CSV)

Desde la última actualización, los productores fueron mejorados para:

✔ Leer datos reales desde archivos CSV

Ubicados en la carpeta:

C:/datosBigData/


Ejemplo de estructura:

C:/datosBigData/
 ├── datos_aire/
 ├── datos_sonido/
 └── datos_soterrado/

✔ Enviar archivos completos de golpe si son pocos

Si un CSV tiene menos de 500 registros, se envía todo en un solo lote.

✔ Enviar en lotes si el archivo es grande

Si tiene miles de filas, los productores envían los datos así:

500 mensajes por lote
pausa de 0.2s
siguiente lote...


Esto evita saturar Kafka y mantiene un flujo estable.

✔ Caer a modo aleatorio si el CSV no existe

En caso de que la carpeta no tenga archivos CSV válidos:

→ Se generan datos aleatorios cada 2 segundos
→ Para pruebas rápidas sin dataset real

🐳 Requisitos

Antes de ejecutar cualquier consumidor o productor, asegúrate de que Kafka esté funcionando.

1️⃣ Iniciar Kafka + Zookeeper
docker-compose up -d

2️⃣ Verificar que los topics existen
docker exec kafka bash -c "/usr/bin/kafka-topics --list --bootstrap-server localhost:9092"


Deberías ver:

datos_calidad_aire
datos_sonido
datos_soterrado

3️⃣ Ejecutar un productor correspondiente

Ejemplos:

python productor_calidad_aire_csv.py
python productor_sonido_csv.py
python productor_soterrado_csv.py


Solo entonces los consumidores empezarán a mostrar mensajes.

💡 Notas importantes

Cada consumidor usa un group_id diferente → no interfieren entre sí

Los consumidores se mantienen para:

pruebas locales

debugging

validación de topics

En la capa de Procesamiento, usarán Spark Structured Streaming como consumidor principal.

📝 Historial de cambios relevantes
✔ Reemplazo de productores aleatorios por productores CSV

Fecha: 16/11/2025

Lectura directa desde C:/datosBigData

Envío en lotes

Formato JSON estructurado

✔ Creación de consumidor multitopic

Fecha: 12/11/2025

Ideal para observar múltiples flujos simultáneamente

✔ Configuración completa de Kafka con Docker Compose

Fecha: 12/11/2025

Migración exitosa a confluentinc/cp-kafka

Topics creados correctamente

Consumidores funcionales