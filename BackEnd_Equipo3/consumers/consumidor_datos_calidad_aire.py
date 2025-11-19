from kafka import KafkaConsumer
import json

# --- Configuración ---
TOPIC_NAME = "datos_calidad_aire"  
BROKER = "localhost:9092"

# --- Crear consumidor ---
consumer = KafkaConsumer(
    TOPIC_NAME,
    bootstrap_servers=[BROKER],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",  # empieza desde el primer mensaje
    enable_auto_commit=True,
    group_id="grupo_consumidores"   # identifica este consumidor
)

print(f"🟢 Escuchando mensajes del topic '{TOPIC_NAME}'...\n")

# --- Leer mensajes ---
try:
    for msg in consumer:
        print(json.dumps(msg.value, indent=2, ensure_ascii=False))
        print("-" * 50)
except KeyboardInterrupt:
    print("❌ Consumidor detenido por el usuario.")
finally:
    consumer.close()
