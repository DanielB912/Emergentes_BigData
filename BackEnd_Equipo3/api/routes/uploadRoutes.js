import express from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import path from "path";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.post("/csv", upload.single("file"), (req, res) => {
  return res.json({ message: "CSV recibido, (futuro guardado en BD)" });
});

export default router;
