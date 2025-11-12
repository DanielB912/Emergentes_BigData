// backend/api/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { ioHandler } from "./sockets/ioHandler.js";

const app = express();
app.use(cors());
app.use(express.json());

// Crear servidor HTTP + WebSocket
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Lógica de sockets (eventos)
ioHandler(io);

const PORT = 4000;
server.listen(PORT, () =>
  console.log(`Servidor WebSocket corriendo en http://localhost:${PORT}`)
);
