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

export default function GraficaDispercion7Dias({ data }) {
  // Si no llega data, evitamos que explote
  if (!data) {
    return <h3 style={{ color: "orange" }}>⚠️ No hay datos para mostrar la predicción de 7 días.</h3>;
  }

  // Validar que la estructura sea correcta
  const sensores = Object.keys(data);
  if (sensores.length === 0) {
    return <h3 style={{ color: "orange" }}>⚠️ No hay sensores dentro del archivo de predicción.</h3>;
  }

  const [sensor, setSensor] = useState(sensores[0]);

  // Validar que existan predicciones para el sensor
  if (!data[sensor] || !data[sensor].predicciones_7_dias) {
    return <h3 style={{ color: "orange" }}>⚠️ El archivo JSON no contiene predicciones de 7 días.</h3>;
  }

  const pred = data[sensor].predicciones_7_dias;

  // Crear arreglo para Recharts
  const datos = Object.entries(pred).map(([fecha, valor], index) => ({
    fecha,
    dia: fecha,
    valor
  }));

  return (
    <div>
      <h2>📅 Predicción — Próximos 7 días</h2>

      <select
        value={sensor}
        onChange={(e) => setSensor(e.target.value)}
        style={{ marginBottom: "15px" }}
      >
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
        <YAxis dataKey="valor" name="Valor" />
        <Tooltip />

        <Scatter data={datos} fill="#00bfff" name="Predicción" />

        <Line
          type="monotone"
          data={datos}
          dataKey="valor"
          stroke="#ff4d4d"
          dot={false}
          name="Tendencia"
        />
      </ScatterChart>
    </div>
  );
}
