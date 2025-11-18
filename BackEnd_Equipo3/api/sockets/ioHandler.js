import {
  getLatestAire,
  getLatestSonido,
  getLatestSoterrado
} from "../services/mongoServices.js";

export default (io) => {
  console.log("🔌 Socket.io conectado. Enviando datos cada 2s...");

  const esAireValido = (d) =>
    d &&
    d.time &&
    d.object &&
    typeof d.object.temperature === "number" &&
    typeof d.object.humidity === "number";

  const esSonidoValido = (d) =>
    d &&
    d.time &&
    d.object &&
    typeof d.object.laeq === "number";

  const esSoterradoValido = (d) =>
    d &&
    d.time &&
    d.object &&
    typeof d.object.vibration === "number";

  setInterval(async () => {
    try {
      const aire = await getLatestAire();
      const sonido = await getLatestSonido();
      const soterrado = await getLatestSoterrado();

      if (esAireValido(aire)) io.emit("aire_update", aire);
      if (esSonidoValido(sonido)) io.emit("sonido_update", sonido);
      if (esSoterradoValido(soterrado)) io.emit("soterrado_update", soterrado);

    } catch (err) {
      console.error("❌ Error enviando datos:", err);
    }
  }, 2000);
};
