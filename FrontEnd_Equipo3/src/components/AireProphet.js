import data from "../data/prophet/aire.json";
import GraficaProphet from "./GraficaProphet";

export default function AireProphet() {
  const data7 = Object.values(data.predicciones_7_dias);
  const data30 = Object.values(data.predicciones_30_dias);

  return (
    <GraficaProphet
      data7={data7}
      data30={data30}
      titulo="Predicción de Calidad del Aire (CO₂)"
      descripcion="Esta gráfica predice la concentración de dióxido de carbono (CO₂) en el ambiente, una medida directa de la calidad del aire."
      unidad="Concentración de CO₂ (ppm)"
    />
  );
}
