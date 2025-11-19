import express from "express";
import { MongoClient } from "mongodb";

const router = express.Router();
const client = new MongoClient("mongodb://mongo_iot:27017");
await client.connect();
const db = client.db("sensores_iot");

// 🎯 1. AIRE: datos entre fechas
router.get("/aire", async (req, res) => {
  const { desde, hasta } = req.query;

  const data = await db.collection("sensor_aire")
    .find({
      time: { $gte: desde, $lte: hasta }
    })
    .sort({ time: 1 })
    .toArray();

  res.json(data);
});

// 🎯 2. SONIDO
router.get("/sonido", async (req, res) => {
  const { desde, hasta } = req.query;

  const data = await db.collection("sensor_sonido")
    .find({
      time: { $gte: desde, $lte: hasta }
    })
    .sort({ time: 1 })
    .toArray();

  res.json(data);
});

// 🎯 3. SOTERRADO
router.get("/soterrado", async (req, res) => {
  const { desde, hasta } = req.query;

  const data = await db.collection("sensor_soterrado")
    .find({
      time: { $gte: desde, $lte: hasta }
    })
    .sort({ time: 1 })
    .toArray();

  res.json(data);
});

// 🎯 4. Sensores disponibles (aires, sonidos, soterrados)
router.get("/sensores", async (req, res) => {
  const aireNames = await db.collection("sensor_aire").distinct("device_name");
  const sonidoNames = await db.collection("sensor_sonido").distinct("device_name");
  const soterradoNames = await db.collection("sensor_soterrado").distinct("device_name");

  res.json({
    aire: aireNames,
    sonido: sonidoNames,
    soterrado: soterradoNames,
  });
});

export default router;
