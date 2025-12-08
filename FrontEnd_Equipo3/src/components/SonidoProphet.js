import data from "../data/prophet/sonido.json";
import GraficaProphet from "./GraficaProphet";

export default function SonidoProphet() {
  const data7 = Object.values(data.predicciones_7_dias);
  const data30 = Object.values(data.predicciones_30_dias);

  return (
    <GraficaProphet
      data7={data7}
      data30={data30}
      titulo="Predicción de Nivel de Ruido Ambiental"
      descripcion="Esta gráfica predice el nivel de contaminación acústica en el entorno mediante el indicador LAeq."
      unidad="Nivel de Ruido (dB)"
    />
  );
}
