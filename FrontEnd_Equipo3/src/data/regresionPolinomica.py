import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# ===========================================================
# 1) Cargar Excel (CAMBIAR SOLO ESTE NOMBRE)
# ===========================================================
FILE = "../Archivos/EM500-CO2-915M nov 2024.xlsx"
df = pd.read_excel(FILE)

# Renombrar columnas para trabajar más cómodo
df = df.rename(columns={
    "time": "fecha",
    "object.co2": "co2",
    "deviceInfo.deviceName": "sensor"
})

# Eliminar filas sin datos
df = df.dropna(subset=["fecha", "co2"])

# ===========================================================
# 2) Mostrar sensores detectados
# ===========================================================
sensores = df["sensor"].unique()

print("\nSensores detectados en el archivo:")
for s in sensores:
    print(" -", s)

# Seleccionar el primer sensor (luego podemos pedir elegir)
sensor_usado = sensores[0]
print(f"\nUsando sensor: {sensor_usado}")

df = df[df["sensor"] == sensor_usado]


# ===========================================================
# 3) Convertir FECHA correctamente (ISO8601 con timezone)
# ===========================================================
df["fecha"] = pd.to_datetime(df["fecha"], format="ISO8601", utc=True)
df["fecha"] = df["fecha"].dt.tz_convert("America/La_Paz")
df = df.dropna(subset=["fecha"])
df = df.sort_values("fecha")


# ===========================================================
# 4) Convertir fecha → segundos desde inicio (para regresión)
# ===========================================================
df["t"] = (df["fecha"] - df["fecha"].min()).dt.total_seconds()

X = df["t"].values.reshape(-1, 1)
y = df["co2"].values


# ===========================================================
# 5) Regresión polinómica
# ===========================================================
grado = 2 # <-- puedes cambiar 2, 3, 4, 5, etc.

poly = PolynomialFeatures(degree=grado)
X_poly = poly.fit_transform(X)

model = LinearRegression()
model.fit(X_poly, y)

y_pred = model.predict(X_poly)


# ===========================================================
# 6) Métricas
# ===========================================================
mse = mean_squared_error(y, y_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y, y_pred)
r2 = r2_score(y, y_pred)

print("\n📌 MÉTRICAS:")
print(f"Sensor usado     : {sensor_usado}")
print(f"Grado del modelo : {grado}")
print(f"R²               : {r2:.6f}")
print(f"MSE              : {mse:.6f}")
print(f"RMSE             : {rmse:.6f}")
print(f"MAE              : {mae:.6f}")


# ===========================================================
# 7) Gráfica final
# ===========================================================
plt.figure(figsize=(12, 6))

plt.scatter(df["fecha"], y, label="Datos reales CO₂", color="red", s=20)
plt.plot(df["fecha"], y_pred, label=f"Regresión Polinómica (grado {grado})", color="blue")

plt.title(f"Regresión Polinómica CO₂ - Sensor {sensor_usado}")
plt.xlabel("Fecha y hora (Bolivia)")
plt.ylabel("CO₂ (ppm)")
plt.grid(True)
plt.legend()
plt.tight_layout()

plt.show()
