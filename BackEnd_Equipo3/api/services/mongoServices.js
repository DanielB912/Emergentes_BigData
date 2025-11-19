import { MongoClient } from "mongodb";

// Conexión al contenedor Docker (mongo_iot)
const client = new MongoClient("mongodb://mongo_iot:27017");
await client.connect();

const db = client.db("sensores_iot");

// ============================
// EXPORTS NUEVOS NECESARIOS
// ============================
export const mongoClient = client;
export const getMongoDB = () => db;

// ============================
// FUNCIONES EXISTENTES
// ============================
export const getLatestAire = async () => {
  const res = await db
    .collection("sensor_aire")
    .find()
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
  return res[0];
};

export const getLatestSonido = async () => {
  const res = await db
    .collection("sensor_sonido")
    .find()
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
  return res[0];
};

export const getLatestSoterrado = async () => {
  const res = await db
    .collection("sensor_soterrado")
    .find()
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
  return res[0];
};
