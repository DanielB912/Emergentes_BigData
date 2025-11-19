import express from "express";
import multer from "multer";
import Papa from "papaparse";

import { getPgClient } from "../services/pgService.js";
import { mongoClient, getMongoDB } from "../services/mongoServices.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Detecta tipo de sensor basado en el nombre
function detectSensorType(row) {
  const name = row.deviceName?.toLowerCase();
  if (!name) return null;
  if (name.includes("aire")) return "aire";
  if (name.includes("sonido")) return "sonido";
  if (name.includes("soterrado")) return "soterrado";
  return null;
}

router.post("/csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const content = req.file.buffer.toString("utf8");
    const parsed = Papa.parse(content, { header: true }).data;

    const pg = await getPgClient();
    const mongoDB = getMongoDB();

    let insertedCount = 0;

    for (const row of parsed) {
      if (!row.deviceName || !row.time) continue;

      const tipo = detectSensorType(row);
      if (!tipo) continue;

      // 1. Insert sensor (PostgreSQL)
      const sensorPG = await pg.query(
        `INSERT INTO sensor (device_name, tipo_sensor)
         VALUES ($1, $2)
         ON CONFLICT (device_name) DO NOTHING
         RETURNING sensor_id`,
        [row.deviceName, tipo]
      );

      let sensorId;

      if (sensorPG.rows.length > 0) {
        sensorId = sensorPG.rows[0].sensor_id;
      } else {
        const check = await pg.query(
          "SELECT sensor_id FROM sensor WHERE device_name=$1",
          [row.deviceName]
        );
        sensorId = check.rows[0].sensor_id;
      }

      // 2. Insert measurements (PG)
      if (tipo === "aire") {
        await pg.query(
          `INSERT INTO sensor_aire (sensor_id, fecha_hora, temperature, humidity, co2, pressure)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [sensorId, row.time, row.temperature, row.humidity, row.co2, row.pressure]
        );
      }

      if (tipo === "sonido") {
        await pg.query(
          `INSERT INTO sensor_sonido (sensor_id, fecha_hora, laeq, lai, laimax, battery, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [sensorId, row.time, row.laeq, row.lai, row.laiMax, row.laiMax, row.status]
        );
      }

      if (tipo === "soterrado") {
        await pg.query(
          `INSERT INTO sensor_soterrado (sensor_id, fecha_hora, vibration, moisture, methane, temperature, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            sensorId,
            row.time,
            row.vibration,
            row.moisture,
            row.methane,
            row.temperature,
            row.status,
          ]
        );
      }

      // 3. Insert into Mongo
      await mongoDB.collection("sensor_" + tipo).insertOne({
        device_name: row.deviceName,
        time: row.time,
        object: row,
      });

      insertedCount++;
    }

    res.json({
      message: "CSV procesado correctamente",
      inserted: insertedCount,
    });
  } catch (err) {
    console.error("CSV Error:", err);
    res.status(500).json({ error: "Error procesando CSV" });
  }
});

export default router;
