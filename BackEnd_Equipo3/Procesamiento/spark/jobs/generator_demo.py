import json, random, time, datetime, os

OUT_DIR = "/opt/spark-apps/inbox"  # montado desde Procesamiento/spark/inbox
os.makedirs(OUT_DIR, exist_ok=True)

types = ["air", "sound", "subsoil"]
units = {"air": "PM2.5", "sound": "dB", "subsoil": "ppm"}
zones = ["Norte", "Sur", "Este", "Oeste", "Centro"]

while True:
    t = random.choice(types)
    v = round(random.uniform(5, 120), 2)
    u = units[t]
    z = random.choice(zones)
    ts = datetime.datetime.utcnow().replace(microsecond=0).isoformat()

    data = {"type": t, "value": v, "unit": u, "zone": z, "ts": ts}
    fname = f"event_{int(time.time()*1000)}.json"

    path = os.path.join(OUT_DIR, fname)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f)
    print("Evento generado:", data)

    time.sleep(1)
