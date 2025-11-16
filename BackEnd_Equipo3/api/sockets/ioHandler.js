// backend/api/sockets/ioHandler.js
export const ioHandler = (io) => {
  console.log("Socket.IO inicializado.");

  io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado:", socket.id);

    // Enviar datos simulados (aire)
    setInterval(() => {
      const datoAire = {
        time: new Date().toISOString(),
        object: {
          temperature: (20 + Math.random() * 10).toFixed(2),
          humidity: (40 + Math.random() * 30).toFixed(2),
        },
      };
      socket.emit("nuevoDatoAire", datoAire);
    }, 2000);

    // Enviar datos simulados (sonido)
    setInterval(() => {
      const datoSonido = {
        time: new Date().toISOString(),
        object: {
          laeq: (50 + Math.random() * 40).toFixed(2),
          laiMax: (70 + Math.random() * 20).toFixed(2),
        },
      };
      socket.emit("nuevoDatoSonido", datoSonido);
    }, 2500);

    // Enviar datos simulados (soterrado)
    setInterval(() => {
      const datoSoterrado = {
        time: new Date().toISOString(),
        object: {
          distance: (Math.random() * 10).toFixed(2),
        },
      };
      socket.emit("nuevoDatoSoterrado", datoSoterrado);
    }, 3000);

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });
};
