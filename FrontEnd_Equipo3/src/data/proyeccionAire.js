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

import predTemp from "../data/PrediccionesAnteriores/prediccion_temperaturaSARIMA.json";
import predHum from "../data/PrediccionesAnteriores/prediccion_humedadSARIMA.json";
import "../styles.css";

function ProyeccionAire() {
  const [modo, setModo] = useState("semanal");
  const [variable, setVariable] = useState("temperatura");
  const [sensor, setSensor] = useState("EMS-6500"); // 👈 NUEVO SELECTOR
  const [data, setData] = useState([]);
  const [kpis, setKpis] = useState({});

  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // 🔄 Reprocesar datos si cambia el modo, variable o sensor
  useEffect(() => {
    procesarDatos();
  }, [modo, variable, sensor]);

  const obtenerJSON = () =>
    variable === "temperatura" ? predTemp : predHum;

  const procesarDatos = () => {
    const fuenteJSON = obtenerJSON();

    // 👇 Leer datos del sensor seleccionado
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
      <h2>🌬️ Proyección de Aire (Temperatura / Humedad)</h2>

      {/* Selectores */}
      <div className="modo-selector">

        {/* 🔘 Selector de variable */}
        <label>Variable:</label>
        <select value={variable} onChange={(e) => setVariable(e.target.value)}>
          <option value="temperatura">Temperatura</option>
          <option value="humedad">Humedad</option>
        </select>

        {/* 🔘 Selector de sensor */}
        <label>Sensor:</label>
        <select value={sensor} onChange={(e) => setSensor(e.target.value)}>
          <option value="EMS-6500">EMS-6500</option>
          <option value="EMS-6962">EMS-6962</option>
          <option value="EMS-6968">EMS-6968</option>
          <option value="EMS-6993">EMS-6993</option>
        </select>

        {/* 🔘 Selector de modo */}
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
          <p>
            {kpis.promedio} {variable === "temperatura" ? "°C" : "%"}
          </p>
        </div>

        <div className="kpi-card">
          <h4>🔼 Máximo</h4>
          <p>
            {kpis.maximo} {variable === "temperatura" ? "°C" : "%"}
          </p>
        </div>

        <div className="kpi-card">
          <h4>🔽 Mínimo</h4>
          <p>
            {kpis.minimo} {variable === "temperatura" ? "°C" : "%"}
          </p>
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

      {/* Gráfica */}
      <h3>
        {modo === "semanal"
          ? `📅 Proyección Semanal de ${variable} — ${sensor}`
          : `📆 Proyección Mensual de ${variable} — ${sensor}`}
      </h3>

      <div className="grafica-container">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="confianza" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4e9cff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4e9cff" stopOpacity={0} />
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
              stroke="#00c49f"
              fill="url(#confianza)"
              name="Máximo"
            />
            <Area
              type="monotone"
              dataKey="min"
              stroke="#ff8042"
              fill="url(#confianza)"
              name="Mínimo"
            />

            <Line
              type="monotone"
              dataKey="valor"
              stroke={variable === "temperatura" ? "#4e9cff" : "#00b4ff"}
              strokeWidth={3}
              dot={false}
              name={
                variable === "temperatura"
                  ? "Temperatura predicha"
                  : "Humedad predicha"
              }
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ProyeccionAire;
