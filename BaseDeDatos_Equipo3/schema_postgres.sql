CREATE DATABASE sensores_iot;
\c sensores_iot;

CREATE TABLE sensor (
    sensor_id SERIAL PRIMARY KEY,
    dev_eui VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150),
    tipo_sensor VARCHAR(30) CHECK (tipo_sensor IN ('Aire','Sonido','Soterrado')),
    ubicacion VARCHAR(200),
    latitud DECIMAL(9,6),
    longitud DECIMAL(9,6),
    tenant VARCHAR(100),
    application_name VARCHAR(100)
);

CREATE TABLE telemetria (
    telemetry_id BIGSERIAL PRIMARY KEY,
    sensor_id INT NOT NULL REFERENCES sensor(sensor_id),
    fecha_hora TIMESTAMP NOT NULL,
    payload_hex TEXT,
    rssi DOUBLE PRECISION,
    snr DOUBLE PRECISION,
    dr VARCHAR(20),
    fcnt INT,
    confirmed BOOLEAN
);


CREATE TABLE sensor_aire (
    telemetry_id BIGINT PRIMARY KEY REFERENCES telemetria(telemetry_id),
    co2 DOUBLE PRECISION,
    temperatura DOUBLE PRECISION,
    humedad DOUBLE PRECISION,
    presion DOUBLE PRECISION,
    bateria DOUBLE PRECISION,
    estado VARCHAR(50)
);


CREATE TABLE sensor_sonido (
    telemetry_id BIGINT PRIMARY KEY REFERENCES telemetria(telemetry_id),
    laeq DOUBLE PRECISION,
    lai DOUBLE PRECISION,
    laimax DOUBLE PRECISION,
    bateria DOUBLE PRECISION,
    estado VARCHAR(50)
);


CREATE TABLE sensor_soterrado (
    telemetry_id BIGINT PRIMARY KEY REFERENCES telemetria(telemetry_id),
    distancia DOUBLE PRECISION,
    posicion VARCHAR(50),
    bateria DOUBLE PRECISION,
    estado VARCHAR(50)
);


-- Analítica / Métricas procesadas
-- Tabla: Métricas Aire (promedios y análisis etc)

CREATE TABLE metricas_aire (
    id_metricas SERIAL PRIMARY KEY,
    sensor_id INT NOT NULL REFERENCES sensor(sensor_id),
    fecha DATE NOT NULL,                      -- Día del cálculo o agregación
    promedio_co2 DOUBLE PRECISION,
    promedio_temperatura DOUBLE PRECISION,
    promedio_humedad DOUBLE PRECISION,
    promedio_presion DOUBLE PRECISION,
    max_co2 DOUBLE PRECISION,
    min_co2 DOUBLE PRECISION,
    desviacion_co2 DOUBLE PRECISION,
    correlacion_temp_hum DOUBLE PRECISION,
    correlacion_co2_temp DOUBLE PRECISION,
    registros_procesados INT,                 -- este campo va a ser pa la cantidad de registros crudos usados
    creado_en TIMESTAMP DEFAULT NOW()         -- marca temporal del procesamiento
);

-- Metricas Sonido
CREATE TABLE metricas_sonido (
    id_metricas SERIAL PRIMARY KEY,
    sensor_id INT NOT NULL REFERENCES sensor(sensor_id),
    fecha DATE NOT NULL,
    promedio_laeq DOUBLE PRECISION,
    promedio_lai DOUBLE PRECISION,
    promedio_laimax DOUBLE PRECISION,
    max_laeq DOUBLE PRECISION,
    min_laeq DOUBLE PRECISION,
    desviacion_laeq DOUBLE PRECISION,
    registros_procesados INT,
    creado_en TIMESTAMP DEFAULT NOW()
);


-- Metricas Soterrado

CREATE TABLE metricas_soterrado (
    id_metricas SERIAL PRIMARY KEY,
    sensor_id INT NOT NULL REFERENCES sensor(sensor_id),
    fecha DATE NOT NULL,
    promedio_distancia DOUBLE PRECISION,
    max_distancia DOUBLE PRECISION,
    min_distancia DOUBLE PRECISION,
    desviacion_distancia DOUBLE PRECISION,
    promedio_bateria DOUBLE PRECISION,
    registros_procesados INT,
    creado_en TIMESTAMP DEFAULT NOW()
);


-- Tabla: Correlaciones Globales
-- (para análisis entre sensores o tipos distintos)

CREATE TABLE correlaciones_globales (
    id_corr SERIAL PRIMARY KEY,
    tipo_sensor_origen VARCHAR(30) CHECK (tipo_sensor_origen IN ('Aire','Sonido','Soterrado')),
    tipo_sensor_destino VARCHAR(30) CHECK (tipo_sensor_destino IN ('Aire','Sonido','Soterrado')),
    fecha DATE NOT NULL,
    variable_origen VARCHAR(50),
    variable_destino VARCHAR(50),
    valor_correlacion DOUBLE PRECISION,
    metodo_calculo VARCHAR(50) DEFAULT 'pearson',
    creado_en TIMESTAMP DEFAULT NOW()
);
