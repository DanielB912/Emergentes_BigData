import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { procesarCSVyEnviarKafka } from "../utils/enviarKafkaDesdeCSV.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Guardar CSV temporalmente
const upload = multer({
  dest: path.join(__dirname, "../uploads"),
});

// Subir archivo + enviar a Kafka
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const tipo = req.query.tipo;
    if (!["aire", "sonido", "soterrado"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo de sensor inválido" });
    }

    const pathCSV = req.file.path;

    // Enviar contenido CSV a Kafka
    await procesarCSVyEnviarKafka(pathCSV, tipo);

    return res.json({
      ok: true,
      mensaje: "Archivo cargado y datos enviados a Kafka correctamente",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error procesando archivo" });
  }
});

export default router;
