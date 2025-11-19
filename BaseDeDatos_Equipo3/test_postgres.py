# -*- coding: utf-8 -*-
import psycopg2
from psycopg2 import sql
#esto solo es pruba nada que ver con el modulo
def main():
    conn = None
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="sensores_iot",
            user="postgres",
            password="12345",
            port="5432"
        )
        conn.autocommit = True
        cursor = conn.cursor()

        print("OK: Conexion lista.")

        # ===============================
        # INSERTAR REGISTRO
        # ===============================
        insert_query = """
            INSERT INTO sensor (
                dev_eui, nombre, tipo_sensor, ubicacion,
                latitud, longitud, tenant, application_name
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING sensor_id;
        """

        valores = (
            "TEST12345",
            "Sensor de prueba",
            "Aire",
            "Laboratorio Central",
            -17.3844,
            -66.1530,
            "Ciudad Digital",
            "App IoT"
        )

        cursor.execute(insert_query, valores)
        sensor_id = cursor.fetchone()[0]
        print(f"Insertado con ID = {sensor_id}")

        # ===============================
        # CONSULTAR REGISTRO
        # ===============================
        cursor.execute("SELECT * FROM sensor WHERE sensor_id = %s;", (sensor_id,))
        registro = cursor.fetchone()
        print("\nRegistro encontrado:")
        print(registro)

        # ===============================
        # ELIMINAR REGISTRO
        # ===============================
        cursor.execute("DELETE FROM sensor WHERE sensor_id = %s;", (sensor_id,))
        print(f"\nRegistro {sensor_id} eliminado.")

    except Exception as e:
        print("ERROR:", repr(e))

    finally:
        if conn:
            cursor.close()
            conn.close()
            print("Conexion cerrada.")

if __name__ == "__main__":
    main()
