1. Descripción General

Este módulo implementa un sistema de predicción basado en Machine Learning utilizando Facebook Prophet, aplicado a datos ambientales del GAMC.

Se generan predicciones para las siguientes variables:

Calidad del Aire (CO₂)

Ruido Ambiental (Sonido - LAeq)

Gas Metano (Zonas Soterradas)

Las predicciones se realizan a horizontes de:

7 días

30 días

Los resultados se exportan en formato JSON para su visualización directa en el Frontend del Dashboard.

2. Equipo Responsable

Equipo 2 – Modelo de Predicción con Prophet

Funciones principales del equipo:

Entrenamiento de modelos de predicción

Generación de predicciones a corto y mediano plazo

Exportación de resultados para visualización

Comparación conceptual con otros modelos (Regresión Lineal)

3. Estructura del Módulo
BackEnd_Equipo3/proyecciones_prophet/
│
├── data_input/
│   ├── dataset_aire.csv
│   ├── dataset_sonido.csv
│   └── dataset_soterrado.csv
│
├── output/
│   ├── prediccion_co2_prophet.json
│   ├── prediccion_sonido_prophet.json
│   └── prediccion_soterrado_prophet.json
│
├── prophet_aire.py
├── prophet_sonido.py
├── prophet_soterrado.py
└── README.md

4. Requisitos Previos

Antes de ejecutar el módulo es necesario tener instalado:

Python 3.9 o superior

Pandas

Prophet

Plotly (opcional)

Instalación rápida de dependencias
pip install pandas prophet plotly

5. Entrada de Datos

Los archivos CSV deben colocarse en la carpeta:

data_input/


Cada archivo debe contener al menos las siguientes columnas:

Aire
fecha_hora, co2

Sonido
fecha_hora, laeq

Soterrado
fecha_hora, methane

6. Ejecución de los Modelos

Ubicarse en la carpeta:

cd BackEnd_Equipo3/proyecciones_prophet


Ejecutar cada modelo según corresponda:

Aire (CO₂)

python prophet_aire.py


Sonido (LAeq)

python prophet_sonido.py


Soterrado (Metano)

python prophet_soterrado.py

7. Salida de Resultados

Los resultados se guardan automáticamente en:

output/


Formato de cada archivo JSON:

{
  "predicciones_7_dias": {
    "YYYY-MM-DD": valor
  },
  "predicciones_30_dias": {
    "YYYY-MM-DD": valor
  }
}


Estos archivos son consumidos directamente por el Frontend en React para mostrar las gráficas con selector de rango (7 y 30 días).

8. Integración con el Frontend

Los archivos generados deben copiarse a la siguiente ruta del frontend:

FrontEnd_Equipo3/src/data/prophet/


Correspondencia de nombres:

Backend Output	Frontend
prediccion_co2_prophet.json	aire.json
prediccion_sonido_prophet.json	sonido.json
prediccion_soterrado_prophet.json	soterrado.json
9. Fundamentación Técnica

Prophet es un modelo desarrollado por Facebook especializado en:

Series temporales

Tendencias no lineales

Predicciones robustas ante datos faltantes

Soporte automático de estacionalidad

Por estas razones, se eligió Prophet sobre:

Regresión Lineal simple

Modelos estadísticos básicos

10. Estado Actual del Módulo

Modelos entrenados correctamente

Predicciones a 7 y 30 días generadas

Resultados exportados en formato JSON

Gráficas integradas en el Dashboard

Selección dinámica mediante ComboBox

Explicación clara de unidades (ppm, dB, metano)
