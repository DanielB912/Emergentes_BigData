import { useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";

export default function GraficaProphet({
  data7,
  data30,
  titulo,
  descripcion,
  unidad
}) {
  const [rango, setRango] = useState("7");

  const datosSeleccionados = rango === "7" ? data7 : data30;

  const dataFinal = datosSeleccionados.map((valor, index) => ({
    dia: index + 1,
    valor
  }));

  return (
    <div style={{ marginBottom: "60px" }}>
      <h2>{titulo}</h2>
      <p style={{ marginBottom: "10px", opacity: 0.8 }}>{descripcion}</p>

      {/* ✅ COMBOBOX */}
      <label><b>Rango de predicción: </b></label>
      <select
        value={rango}
        onChange={(e) => setRango(e.target.value)}
        style={{ marginBottom: "15px", padding: "6px" }}
      >
        <option value="7">Próximos 7 días</option>
        <option value="30">Próximos 30 días</option>
      </select>

      <LineChart width={850} height={380} data={dataFinal}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="dia"
          label={{ value: "Días futuros", position: "insideBottom", dy: 10 }}
        />
        <YAxis
          label={{
            value: unidad,
            angle: -90,
            position: "insideLeft"
          }}
        />
        <Tooltip />
        <Legend />

        <Line
          type="monotone"
          dataKey="valor"
          stroke="#ff7300"
          name={`Predicción a ${rango} días`}
        />
      </LineChart>
    </div>
  );
}
