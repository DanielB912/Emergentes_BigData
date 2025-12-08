import React, { useEffect, useState } from "react";
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

import sonidoData from "../data/resultados_sonido.json";
import "../styles.css";

function ProyeccionSonido() {
  const [sensor, setSensor] = useState(Object.keys(sonidoData)[0]);
  const [modo, setModo] = useState("7d"); // 7d | 30d
  const [serie, setSerie] = useState([]);
  const [kpis, setKpis] = useState({});

  useEffect(() => {
    procesarDatos();
  }, [sensor, modo]);

  const procesarDatos = () => {
    const sData = sonidoData[sensor];
    if (!sData) return;

  
    const historico = sData.test.fechas.map((f, i) => ({
      fecha: f,
      real: sData.test.real[i],
      predicho: sData.test.predicho[i],
      estimado: null,
    }));

  
    const forecast =
      modo === "7d" ? sData.forecast_7d : sData.forecast_30d;

    const futuro = forecast.fechas.map((f, i) => ({
      fecha: f,
      real: null,
      predicho: null,
      estimado: forecast.estimado[i],
    }));

 
    setSerie([...historico, ...futuro]);

    setKpis({
      r2: sData.metrics.r2.toFixed(3),
      rmse: sData.metrics.rmse.toFixed(2),
      mae: sData.metrics.mae.toFixed(2),
    });
  };

  const formatFecha = (f) =>
    new Date(f).toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "2-digit",
    });

  return (
    <div className="dashboard">
      <h2>🔊 Proyección de Sonido — LAeq</h2>

      {/* SELECTORES */}
      <div className="modo-selector">
        <label>Sensor:</label>
        <select value={sensor} onChange={(e) => setSensor(e.target.value)}>
          {Object.keys(sonidoData).map((s) => (
            <option key={s} value={s}>{s}</option>
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
        <div className="kpi-card"><h4>R²</h4><p>{kpis.r2}</p></div>
        <div className="kpi-card"><h4>RMSE</h4><p>{kpis.rmse} dB</p></div>
        <div className="kpi-card"><h4>MAE</h4><p>{kpis.mae} dB</p></div>
      </div>

      {/* GRÁFICA ÚNICA */}
      <h3>
        📈 LAeq — Histórico y Pronóstico ({modo === "7d" ? "7 días" : "30 días"})
      </h3>

      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={serie}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="fecha"
            tickFormatter={formatFecha}
            type="category"
          />
          <YAxis />
          <Tooltip />
          <Legend />

          {/* REAL */}
          <Line
            type="monotone"
            dataKey="real"
            stroke="#ff0000"
            dot
            name="LAeq real (test)"
          />

          {/* PREDICHO */}
          <Line
            type="monotone"
            dataKey="predicho"
            stroke="#1e90ff"
            dot={false}
            name="LAeq predicho (test)"
          />

          {/* FUTURO */}
          <Line
            type="monotone"
            dataKey="estimado"
            stroke="#00c853"
            strokeDasharray="4 4"
            dot={false}
            name={`LAeq estimado (${modo})`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ProyeccionSonido;
