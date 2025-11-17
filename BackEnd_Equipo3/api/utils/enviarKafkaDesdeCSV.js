import fs from "fs";
import csv from "csv-parser";
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "csv-uploader",
  brokers: ["kafka:9092"],
});

// Mapeo según tipo
const TOPICS = {
  aire: "datos_calidad_aire",
  sonido: "datos_sonido",
  soterrado: "datos_soterrado",
};

export async function procesarCSVyEnviarKafka(pathCSV, tipo) {
  return new Promise(async (resolve, reject) => {
    const producer = kafka.producer();
    await producer.connect();

    const topic = TOPICS[tipo];

    const stream = fs.createReadStream(pathCSV).pipe(csv());

    stream.on("data", async (row) => {
      try {
        const message = construirMensaje(row, tipo);

        await producer.send({
          topic,
          messages: [{ value: JSON.stringify(message) }],
        });
        console.log("ENVIADO:", message);

      } catch (err) {
        console.error("Error enviando fila:", err);
      }
    });

    stream.on("end", async () => {
      await producer.disconnect();
      console.log("CSV procesado completamente.");
      resolve();
    });

    stream.on("error", (err) => {
      console.error("Error procesando CSV:", err);
      reject(err);
    });
  });
}

// Construcción del JSON según tipo

function construirMensaje(row, tipo) {
  return {
    time: row.time || new Date().toISOString(),
    deviceInfo: {
      deviceName: row.deviceName || `Sensor_${tipo}`,
    },
    object: tipo === "aire"
      ? {
          temperature: Number(row.temperature),
          humidity: Number(row.humidity),
          co2: Number(row.co2),
          pressure: Number(row.pressure),
        }
      : tipo === "sonido"
      ? {
          laeq: Number(row.laeq),
          lai: Number(row.lai),
          laiMax: Number(row.laiMax),
          battery: Number(row.battery),
          status: row.status,
        }
      : {
          vibration: Number(row.vibration),
          moisture: Number(row.moisture),
          methane: Number(row.methane),
          temperature: Number(row.temperature),
          status: row.status,
        },
  };
}
