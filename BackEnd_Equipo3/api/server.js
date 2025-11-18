import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

import uploadRoutes from "./routes/uploadRoutes.js";
import csvRoutes from "./routes/csvRoutes.js";
import dataRoutes from "./routes/dataRoutes.js";
import ioHandler from "./sockets/ioHandler.js";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use("/api/data", dataRoutes);
// WebSocket
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

ioHandler(io);

// Rutas API
app.use("/api/upload", uploadRoutes);
app.use("/api/csv", csvRoutes);

// Prueba
app.get("/", (req, res) => {
  res.send("API funcionando ✔️");
});

server.listen(4000, () => {
  console.log("🚀 Servidor backend en http://localhost:4000");
});
