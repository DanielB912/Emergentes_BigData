from kafka import KafkaConsumer
import json

TOPICS = ["datos_calidad_aire", "datos_sonido", "datos_soterrado"]
BROKER = "localhost:9092"

consumer = KafkaConsumer(
    *TOPICS,
    bootstrap_servers=[BROKER],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="latest",
    enable_auto_commit=True,
    group_id="grupo_multisensor"
)

print("🟢 Escuchando múltiples topics:", TOPICS)

for msg in consumer:
    print(f"\n📌 Topic: {msg.topic}")
    print(json.dumps(msg.value, indent=2, ensure_ascii=False))
    print("-" * 60)
