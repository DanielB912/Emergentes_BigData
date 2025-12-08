import data from "../data/prophet/soterrado.json";
import GraficaProphet from "./GraficaProphet";

export default function SoterradoProphet() {
  const data7 = Object.values(data.predicciones_7_dias);
  const data30 = Object.values(data.predicciones_30_dias);

  return (
    <GraficaProphet
      data7={data7}
      data30={data30}
      titulo="Predicción de Gas Metano en Zonas Soterradas"
      descripcion="Esta gráfica predice la concentración de gas metano en el subsuelo, indicador de posibles riesgos ambientales."
      unidad="Concentración de Metano (ppm)"
    />
  );
}
