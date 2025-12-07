import psycopg2
import pandas as pd
import os

# =====================================================
# CONFIG POSTGRES (HOST)
# =====================================================
PG_HOST = "localhost"
PG_PORT = 5433
PG_DB = "SensoresIoT"
PG_USER = "postgres"
PG_PASS = "12345"

OUTPUT_DIR = r"D:\Emergentes\PRACTICA3INTEGRADO\Emergentes_BigData\FrontEnd_Equipo3\src\data\output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# =====================================================
# CONEXIÓN
# =====================================================
conn = psycopg2.connect(
    host=PG_HOST,
    port=PG_PORT,
    dbname=PG_DB,
    user=PG_USER,
    password=PG_PASS
)

# =====================================================
# 1️⃣ DATASET AIRE
# =====================================================
query_aire = """
SELECT
    sa.fecha_hora,
    s.sensor_id,
    sa.temperature,
    sa.humidity,
    sa.co2,
    sa.pressure
FROM sensor_aire sa
JOIN sensor s ON s.sensor_id = sa.sensor_id
ORDER BY sa.fecha_hora
"""
df_aire = pd.read_sql(query_aire, conn)

# Limpieza
df_aire["fecha_hora"] = pd.to_datetime(df_aire["fecha_hora"])
df_aire = df_aire.drop_duplicates()
df_aire = df_aire.dropna()

df_aire.to_csv(os.path.join(OUTPUT_DIR, "dataset_aire.csv"), index=False)


# =====================================================
# 2️⃣ DATASET SONIDO
# =====================================================
query_sonido = """
SELECT
    ss.fecha_hora,
    s.sensor_id,
    ss.laeq,
    ss.lai,
    ss.laimax
FROM sensor_sonido ss
JOIN sensor s ON s.sensor_id = ss.sensor_id
ORDER BY ss.fecha_hora
"""
df_sonido = pd.read_sql(query_sonido, conn)

df_sonido["fecha_hora"] = pd.to_datetime(df_sonido["fecha_hora"])
df_sonido = df_sonido.drop_duplicates()
df_sonido = df_sonido.dropna()

df_sonido.to_csv(os.path.join(OUTPUT_DIR, "dataset_sonido.csv"), index=False)


# =====================================================
# 3️⃣ DATASET SOTERRADO
# =====================================================
query_soterrado = """
SELECT
    st.fecha_hora,
    s.sensor_id,
    st.vibration,
    st.moisture,
    st.methane,
    st.temperature
FROM sensor_soterrado st
JOIN sensor s ON s.sensor_id = st.sensor_id
ORDER BY st.fecha_hora
"""
df_soterrado = pd.read_sql(query_soterrado, conn)

df_soterrado["fecha_hora"] = pd.to_datetime(df_soterrado["fecha_hora"])
df_soterrado = df_soterrado.drop_duplicates()
df_soterrado = df_soterrado.dropna()

df_soterrado.to_csv(os.path.join(OUTPUT_DIR, "dataset_soterrado.csv"), index=False)

# =====================================================
# CIERRE
# =====================================================
conn.close()

print("✅ Datasets generados correctamente:")
print(" - dataset_aire.csv")
print(" - dataset_sonido.csv")
print(" - dataset_soterrado.csv")
print(f"📁 Carpeta: {OUTPUT_DIR}")
