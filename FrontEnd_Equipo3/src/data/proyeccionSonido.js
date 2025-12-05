import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

import predLAeq from "../data/prediccion_sonido_laeqSARIMA.json";
import predLAimax from "../data/prediccion_sonido_laimaxSARIMA.json";
import "../styles.css";

export default function ProyeccionSonido() {
  const [modo, setModo] = useState("semanal");
  const [variable, setVariable] = useState("laeq");
  const [sensor, setSensor] = useState("SLS-2648");
  const [data, setData] = useState([]);
  const [kpis, setKpis] = useState({});

  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // 🔄 Procesar cuando algo cambie
  useEffect(() => {
    procesarDatos();
  }, [modo, variable, sensor]);

  const obtenerJSON = () => {
    return variable === "laeq" ? predLAeq : predLAimax;
  };

  const procesarDatos = () => {
    const fuenteJSON = obtenerJSON();

    const sensorData = fuenteJSON[sensor];
    if (!sensorData) return;

    const fuente =
      modo === "semanal"
        ? sensorData.weekly_forecast
        : sensorData.monthly_forecast;

    const procesado = fuente.map((item) => {
      const fechaObj = new Date(item.fecha);
      const diaNombre = diasSemana[fechaObj.getDay()];

      return {
        fecha: item.fecha.split(" ")[0] + ` (${diaNombre})`,
        valor: item.valor_predicho,
        min: item.min,
        max: item.max,
        clasificacion: item.clasificacion,
      };
    });

    setData(procesado);
    generarKPIs(procesado);
  };

  const generarKPIs = (registros) => {
    const valores = registros.map((d) => d.valor);
    const minimos = registros.map((d) => d.min);
    const maximos = registros.map((d) => d.max);

    const clasificaciones = registros.reduce((acc, item) => {
      acc[item.clasificacion] = (acc[item.clasificacion] || 0) + 1;
      return acc;
    }, {});

    setKpis({
      promedio: (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(
        2
      ),
      minimo: Math.min(...minimos).toFixed(2),
      maximo: Math.max(...maximos).toFixed(2),
      clasificaciones,
    });
  };

  return (
    <div className="dashboard">
      <h2>🔊 Proyección de Sonido (LAeq / LAimax)</h2>

      {/* SELECTORES */}
      <div className="modo-selector">

        {/* Variable */}
        <label>Variable:</label>
        <select value={variable} onChange={(e) => setVariable(e.target.value)}>
          <option value="laeq">LAeq</option>
          <option value="laimax">LAimax</option>
        </select>

        {/* Sensor */}
        <label>Sensor:</label>
        <select value={sensor} onChange={(e) => setSensor(e.target.value)}>
          <option value="SLS-2648">SLS-2648</option>
          <option value="SLS-3164">SLS-3164</option>
          <option value="SLS-8588">SLS-8588</option>
          <option value="SLS-8654">SLS-8654</option>
          <option value="SLS-8709">SLS-8709</option>
          <option value="SLS-8852">SLS-8852</option>
          <option value="SLS-9199">SLS-9199</option>
          <option value="SLS-9247">SLS-9247</option>
        </select>

        {/* Modo */}
        <label>Proyección:</label>
        <select value={modo} onChange={(e) => setModo(e.target.value)}>
          <option value="semanal">Semanal</option>
          <option value="mensual">Mensual</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h4>📊 Promedio</h4>
          <p>{kpis.promedio} dB</p>
        </div>

        <div className="kpi-card">
          <h4>🔼 Máximo</h4>
          <p>{kpis.maximo} dB</p>
        </div>

        <div className="kpi-card">
          <h4>🔽 Mínimo</h4>
          <p>{kpis.minimo} dB</p>
        </div>

        <div className="kpi-card">
          <h4>📌 Clasificaciones</h4>
          {kpis.clasificaciones &&
            Object.entries(kpis.clasificaciones).map(([clave, valor]) => (
              <p key={clave}>
                {clave}: {valor}
              </p>
            ))}
        </div>
      </div>

      {/* GRÁFICA */}
      <h3>
        {modo === "semanal"
          ? `📅 Proyección Semanal (${variable.toUpperCase()}) — ${sensor}`
          : `📆 Proyección Mensual (${variable.toUpperCase()}) — ${sensor}`}
      </h3>

      <div className="grafica-container">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="confianza" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffaf4e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ffaf4e" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Area
              type="monotone"
              dataKey="max"
              stroke="#ff6e40"
              fill="url(#confianza)"
              name="Máximo"
            />

            <Area
              type="monotone"
              dataKey="min"
              stroke="#ffcc80"
              fill="url(#confianza)"
              name="Mínimo"
            />

            <Line
              type="monotone"
              dataKey="valor"
              stroke="#ff3d00"
              strokeWidth={3}
              dot={false}
              name={
                variable === "laeq"
                  ? "LAeq predicho"
                  : "LAimax predicho"
              }
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
