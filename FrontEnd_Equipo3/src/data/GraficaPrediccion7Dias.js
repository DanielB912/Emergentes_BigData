import { useState } from "react";
import {
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line
} from "recharts";

import dataPred from "../data/prediccion_co2_lineal.json";

//ESTO NO SE USA YA QUE SOLO ERA PARA PROBAR (OJO)


export default function GraficaDispercion7Dias() {
  const sensores = Object.keys(dataPred);
  const [sensor, setSensor] = useState(sensores[0]);

  // Tomamos las predicciones
  const pred = dataPred[sensor].predicciones_7_dias;

  // Convertimos fechas → puntos numéricos
  const datos = Object.entries(pred).map(([fecha, valor], index) => ({
    fecha,
    dia: index + 1,   // eje X (1–7)
    valor             // eje Y
  }));

  return (
    <div>
      <h2>Gráfica de Dispersión - Predicción 7 días</h2>

      <select value={sensor} onChange={(e) => setSensor(e.target.value)}>
        {sensores.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      <ScatterChart
        width={650}
        height={350}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid />
        <XAxis dataKey="dia" name="Día" />
        <YAxis dataKey="valor" name="CO₂" />
        <Tooltip />

        {/* Puntos de dispersión */}
        <Scatter data={datos} fill="#8884d8" name="Predicción" />

        {/* Línea que une los puntos */}
        <Line
          type="monotone"
          data={datos}
          dataKey="valor"
          stroke="#ff0000"
          dot={false}
          name="Tendencia"
        />
      </ScatterChart>
    </div>
  );
}
