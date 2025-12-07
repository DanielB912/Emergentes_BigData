import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Line } from "recharts";

export default function GraficaLineal({ data, coef }) {
  const { const: b0, t: b1 } = coef;

  // Generar predicciones de la regresión lineal
  const predicciones = data.map(d => ({
    t: d.t,
    y: b0 + b1 * d.t
  }));

  return (
    <ScatterChart width={650} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <CartesianGrid />
      <XAxis dataKey="t" name="Tiempo" />
      <YAxis dataKey="y" name="CO2" />
      <Tooltip cursor={{ strokeDasharray: "3 3" }} />

      {/* Datos reales */}
      <Scatter name="Datos reales" data={data} fill="#8884d8" />

      {/* Línea de regresión */}
      <Line type="monotone" data={predicciones} dataKey="y" stroke="#ff0000" dot={false} />
    </ScatterChart>
  );
}
