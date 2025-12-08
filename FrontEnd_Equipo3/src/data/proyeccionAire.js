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
} from "recharts";

import co2Data from "./resultados_co2.json";
import "../styles.css";

function ProyeccionAire() {
  const [modo, setModo] = useState("7d"); // 7d | 30d
  const [sensor, setSensor] = useState(Object.keys(co2Data)[0]);
  const [serie, setSerie] = useState([]);
  const [kpis, setKpis] = useState({});

  useEffect(() => {
    procesarDatos();
  }, [modo, sensor]);

  const formatearFecha = (fechaISO) => {
    const d = new Date(fechaISO);
    return d.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "2-digit",
    });
  };


  const procesarDatos = () => {
    const sensorData = co2Data[sensor];
    if (!sensorData) return;

    /* ======================
       HISTÓRICO (TEST)
    ====================== */
    const test = sensorData.test;
    if (!test || !test.dates) return;

    const historico = test.dates.map((fecha, i) => ({
      fecha,
      co2_real: test.co2_real[i],
      co2_pred: test.co2_pred[i],
      co2_forecast: null,
    }));

    /* ======================
       FORECAST (7d / 30d)
    ====================== */
    const forecast =
      modo === "7d" ? sensorData.forecast_7d : sensorData.forecast_30d;

    if (!forecast || !forecast.dates) return;

    const futuro = forecast.dates.map((fecha, i) => ({
      fecha,
      co2_real: null,
      co2_pred: null,
      co2_forecast: forecast.co2_forecast[i],
    }));

    setSerie([...historico, ...futuro]);

    /* ======================
       KPIs
    ====================== */
    setKpis({
      r2: sensorData.metrics.r2.toFixed(3),
      rmse: sensorData.metrics.rmse.toFixed(2),
      mae: sensorData.metrics.mae.toFixed(2),
    });
  };


  return (
    <div className="dashboard">
      <h2>🌬️ Proyección de CO₂ — Calidad de Aire</h2>

      {/* Selectores */}
      <div className="modo-selector">
        <label>Sensor:</label>
        <select value={sensor} onChange={(e) => setSensor(e.target.value)}>
          {Object.keys(co2Data).map((s) => (
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
          <p>{kpis.rmse} ppm</p>
        </div>
        <div className="kpi-card">
          <h4>MAE</h4>
          <p>{kpis.mae} ppm</p>
        </div>
      </div>

      {/* Gráfica */}
      <h3>
        📈 CO₂ histórico y pronóstico{" "}
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

            {/* CO₂ real */}
            <Line
              type="monotone"
              dataKey="co2_real"
              stroke="#ff4d4f"
              dot
              name="CO₂ real (test)"
            />

            <Line
              type="monotone"
              dataKey="co2_pred"
              stroke="#4e9cff"
              strokeWidth={3}
              dot={false}
              name="CO₂ predicho (test)"
            />

            <Line
              type="monotone"
              dataKey="co2_forecast"
              stroke={modo === "7d" ? "#00c49f" : "#a855f7"}
              strokeDasharray="5 5"
              strokeWidth={3}
              dot={false}
              name={`CO₂ estimado (${modo === "7d" ? "7 días" : "30 días"})`}
            />

          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ProyeccionAire;
