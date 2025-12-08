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
  ReferenceLine,
} from "recharts";

import soterradoData from "./resultados_soterrados.json";
import "../styles.css";

function ProyeccionSoterrado() {
  const sensores = Object.keys(soterradoData || {});
  const [sensor, setSensor] = useState(sensores[0] || "");
  const [modo, setModo] = useState("7d");
  const [serie, setSerie] = useState([]);
  const [kpis, setKpis] = useState({});

  const UMBRAL = 0.6;

  useEffect(() => {
    procesarDatos();
  }, [sensor, modo]);

  const formatearFecha = (f) =>
    new Date(f).toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "2-digit",
    });

  const procesarDatos = () => {
    const sData = soterradoData[sensor];
    if (!sData || !sData.test) return;

    
    const test = sData.test;

    const historico = test.dates.map((fecha, i) => ({
      fecha,
      real: test.real[i],
      pred: test.pred[i],
      forecast: null,
    }));

  
    const forecast =
      modo === "7d" ? sData.forecast_7d : sData.forecast_30d;

    if (!forecast) return;

    const futuro = forecast.dates.map((fecha, i) => ({
      fecha,
      real: null,
      pred: null,
      forecast: forecast.estimated[i],
    }));

    setSerie([...historico, ...futuro]);

   
    setKpis({
      r2: sData.metrics.r2.toFixed(3),
      rmse: sData.metrics.rmse.toFixed(3),
      mae: sData.metrics.mae.toFixed(3),
    });
  };

  return (
    <div className="dashboard">
      <h2>🏗️ Proyección Soterrado — Moisture</h2>

      {/* SELECTORES */}
      <div className="modo-selector">
        <label>Sensor:</label>
        <select value={sensor} onChange={(e) => setSensor(e.target.value)}>
          {sensores.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label>Horizonte:</label>
        <select value={modo} onChange={(e) => setModo(e.target.value)}>
          <option value="7d">7 días</option>
          <option value="30d">30 días</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h4>R²</h4>
          <p>{kpis.r2}</p>
        </div>
        <div className="kpi-card">
          <h4>RMSE</h4>
          <p>{kpis.rmse}</p>
        </div>
        <div className="kpi-card">
          <h4>MAE</h4>
          <p>{kpis.mae}</p>
        </div>
      </div>

      {/* GRÁFICA */}
      <h3>
        📈 Moisture histórico y pronóstico{" "}
        {modo === "7d" ? "(7 días)" : "(30 días)"} — {sensor}
      </h3>

      <div className="grafica-container">
        <ResponsiveContainer width="100%" height={420}>
          <LineChart data={serie}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="fecha"
              tickFormatter={formatearFecha}
              minTickGap={20}
            />
            <YAxis />
            <Tooltip />
            <Legend />

            <ReferenceLine
              y={UMBRAL}
              stroke="red"
              strokeDasharray="4 4"
              label={{
                value: `Umbral (${UMBRAL})`,
                position: "right",
                fill: "red",
                fontSize: 11,
              }}
            />

            <Line
              type="monotone"
              dataKey="real"
              stroke="#ff1744"
              dot
              name="Moisture real (test)"
            />

            <Line
              type="monotone"
              dataKey="pred"
              stroke="#2979ff"
              strokeWidth={3}
              dot={false}
              name="Moisture predicho (test)"
            />

            <Line
              type="monotone"
              dataKey="forecast"
              stroke={modo === "7d" ? "#00c853" : "#a855f7"}
              strokeDasharray="5 5"
              strokeWidth={3}
              dot={false}
              name={`Moisture estimado (${modo === "7d" ? "7 días" : "30 días"})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ProyeccionSoterrado;
