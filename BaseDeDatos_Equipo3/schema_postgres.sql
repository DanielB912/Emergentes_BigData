
--   TABLA: sensor
--   Representa cada dispositivo físico que envía datos.
--   Se crea automáticamente cuando llega un deviceName nuevo.


CREATE TABLE sensor (
    sensor_id SERIAL PRIMARY KEY,
    device_name VARCHAR(100) UNIQUE NOT NULL,  -- Ej: Sensor_Aire_1
    tipo_sensor VARCHAR(20) NOT NULL CHECK(tipo_sensor IN ('Aire','Sonido','Soterrado')),
    creado_en TIMESTAMP DEFAULT NOW()
);


CREATE TABLE sensor_aire (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INT NOT NULL REFERENCES sensor(sensor_id),
    fecha_hora TIMESTAMP NOT NULL,
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    co2 DOUBLE PRECISION,
    pressure DOUBLE PRECISION
);

-- Índice recomendado para acelerar consultas por fecha
CREATE INDEX idx_sensor_aire_fecha
ON sensor_aire (fecha_hora);


CREATE TABLE sensor_sonido (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INT NOT NULL REFERENCES sensor(sensor_id),
    fecha_hora TIMESTAMP NOT NULL,
    laeq DOUBLE PRECISION,
    lai DOUBLE PRECISION,
    laimax DOUBLE PRECISION,
    battery DOUBLE PRECISION,
    status VARCHAR(20)
);

CREATE INDEX idx_sensor_sonido_fecha
ON sensor_sonido (fecha_hora);


CREATE TABLE sensor_soterrado (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INT NOT NULL REFERENCES sensor(sensor_id),
    fecha_hora TIMESTAMP NOT NULL,
    vibration DOUBLE PRECISION,
    moisture DOUBLE PRECISION,
    methane DOUBLE PRECISION,
    temperature DOUBLE PRECISION,
    status VARCHAR(20)
);

CREATE INDEX idx_sensor_soterrado_fecha
ON sensor_soterrado (fecha_hora);

