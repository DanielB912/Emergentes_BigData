import os
import pandas as pd

# Ruta base donde guardas los CSV de prueba
BASE_PATH = r"C:\Users\HP VICTUS\OneDrive\Escritorio\datosBigData"

# Subcarpetas esperadas
CARPETAS = {
    "calidad_aire": ["temperature", "humidity", "co2", "pressure"],
    "sonido": ["laeq", "lai", "laiMax", "battery", "status"],
    "soterrado": ["vibration", "moisture", "methane", "temperature", "status"]
}

def validar_csv(ruta, columnas_esperadas):
    print(f"\n📄 Analizando archivo: {ruta}")

    try:
        df = pd.read_csv(ruta)
    except Exception as e:
        print(f"  ❌ Error leyendo CSV: {e}")
        return

    print(f"  ✔ Filas: {len(df)}")
    print(f"  ✔ Columnas detectadas: {list(df.columns)}")

    # Validación de columnas
    columnas_faltantes = [c for c in columnas_esperadas if c not in df.columns]
    if columnas_faltantes:
        print(f"  ⚠ Columnas faltantes: {columnas_faltantes}")
    else:
        print("  ✔ Columnas correctas")

    # NA check
    if df.isna().sum().sum() > 0:
        print("  ⚠ Hay valores vacíos")
    else:
        print("  ✔ Sin valores vacíos")

    print("  --- Fin de análisis ---")


def main():
    print("🔍 Iniciando validador de CSV...\n")

    for carpeta, columnas in CARPETAS.items():
        ruta_carpeta = os.path.join(BASE_PATH, carpeta)

        print(f"\n📁 Carpeta: {ruta_carpeta}")

        if not os.path.exists(ruta_carpeta):
            print("  ❌ No existe esta carpeta, saltando...")
            continue

        archivos = [f for f in os.listdir(ruta_carpeta) if f.endswith(".csv")]

        if not archivos:
            print("  ⚠ No hay archivos CSV en esta carpeta")
            continue

        for archivo in archivos:
            validar_csv(os.path.join(ruta_carpeta, archivo), columnas)


if __name__ == "__main__":
    main()
