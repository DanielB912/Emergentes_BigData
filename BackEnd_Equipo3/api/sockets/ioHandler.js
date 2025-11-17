// api/sockets/ioHandler.js
import {
  getLastAire,
  getLastSonido,
  getLastSoterrado,
} from "../services/pgService.js";
import { getLastMongo } from "../services/mongoService.js";

export const ioHandler = (io) => {
  console.log("Socket.IO inicializado.");

  io.on("connection", async (socket) => {
    console.log("Nuevo cliente conectado:", socket.id);

    // Enviar datos cada 2s
    setInterval(async () => {
      const aire = await getLastAire();
      socket.emit("aire", aire);
    }, 2000);

    setInterval(async () => {
      const sonido = await getLastSonido();
      socket.emit("sonido", sonido);
    }, 2000);

    setInterval(async () => {
      const soterrado = await getLastSoterrado();
      socket.emit("soterrado", soterrado);
    }, 2000);

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });
};
