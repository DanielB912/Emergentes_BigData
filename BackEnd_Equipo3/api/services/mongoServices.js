// api/services/mongoService.js
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://mongo_iot:27017");
await client.connect();

export const mongoDB = client.db("sensores_iot");

export async function getLastMongo(collection) {
  return await mongoDB
    .collection(collection)
    .find()
    .sort({ time: -1 })
    .limit(20)
    .toArray();
}
