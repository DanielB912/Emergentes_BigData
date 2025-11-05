
CREATE DATABASE SensoresIoT;
GO
USE SensoresIoT;
GO

CREATE TABLE Sensor (
    SensorID INT IDENTITY(1,1) PRIMARY KEY,
    DevEui VARCHAR(50) UNIQUE NOT NULL,
    Nombre NVARCHAR(150),
    TipoSensor VARCHAR(30) CHECK (TipoSensor IN ('Aire','Sonido','Soterrado')),
    Ubicacion NVARCHAR(200),
    Latitud DECIMAL(9,6),
    Longitud DECIMAL(9,6),
    Tenant NVARCHAR(100),
    ApplicationName NVARCHAR(100)
);
GO

CREATE TABLE Telemetria (
    TelemetryID BIGINT IDENTITY(1,1) PRIMARY KEY,
    SensorID INT NOT NULL,
    FechaHora DATETIME NOT NULL,
    PayloadHex NVARCHAR(MAX),  
    RSSI FLOAT NULL,
    SNR FLOAT NULL,
    DR VARCHAR(20) NULL,
    FCnt INT NULL,
    Confirmed BIT NULL,

    CONSTRAINT FK_Telemetria_Sensor
        FOREIGN KEY (SensorID) REFERENCES Sensor(SensorID)
);
GO

CREATE TABLE SensorAire (
    TelemetryID BIGINT PRIMARY KEY,
    CO2 FLOAT,
    Temperatura FLOAT,
    Humedad FLOAT,
    Presion FLOAT,
    Bateria FLOAT,
    Estado VARCHAR(50),

    CONSTRAINT FK_Aire_Telemetria
        FOREIGN KEY (TelemetryID) REFERENCES Telemetria(TelemetryID)
);
GO

CREATE TABLE SensorSonido (
    TelemetryID BIGINT PRIMARY KEY,
    LAEQ FLOAT,
    LAI FLOAT,
    LAIMax FLOAT,
    Bateria FLOAT,
    Estado VARCHAR(50),

    CONSTRAINT FK_Sonido_Telemetria
        FOREIGN KEY (TelemetryID) REFERENCES Telemetria(TelemetryID)
);
GO

CREATE TABLE SensorSoterrado (
    TelemetryID BIGINT PRIMARY KEY,
    Distancia FLOAT,
    Posicion VARCHAR(50),
    Bateria FLOAT,
    Estado VARCHAR(50),

    CONSTRAINT FK_Soterrado_Telemetria
        FOREIGN KEY (TelemetryID) REFERENCES Telemetria(TelemetryID)
);
GO
