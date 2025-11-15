// Selecciona o crea la base sensores_iot
db = db.getSiblingDB("sensores_iot");

db.createCollection("sensor");
db.sensor.createIndex({ device_name: 1 }, { unique: true });

db.createCollection("sensor_aire");
db.sensor_aire.insertOne({ init: true }); 
db.sensor_aire.deleteOne({ init: true });

db.sensor_aire.createIndex({ sensor_id: 1, fecha_hora: -1 });

db.createCollection("sensor_sonido");
db.sensor_sonido.insertOne({ init: true });
db.sensor_sonido.deleteOne({ init: true });

db.sensor_sonido.createIndex({ sensor_id: 1, fecha_hora: -1 });

db.createCollection("sensor_soterrado");
db.sensor_soterrado.insertOne({ init: true });
db.sensor_soterrado.deleteOne({ init: true });

db.sensor_soterrado.createIndex({ sensor_id: 1, fecha_hora: -1 });
