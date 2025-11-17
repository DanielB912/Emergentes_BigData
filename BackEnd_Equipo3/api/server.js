import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

import uploadRoutes from "./routes/uploadRoutes.js";
import { ioHandler } from "./sockets/ioHandler.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", uploadRoutes);

// Crear servidor HTTP + Socket
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

ioHandler(io);

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`API + WebSockets en http://localhost:${PORT}`);
});
