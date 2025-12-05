import React, { useState, useEffect, useMemo } from "react";
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
  ReferenceLine,
} from "recharts";

import methaneJSON from "../data/predicciones_soterrado_methaneRL.json";
import vibrationJSON from "../data/predicciones_soterrado_vibrationRL.json";

import "../styles.css";

export default function ProyeccionSoterrado() {
  const [modo, setModo] = useState("semanal"); // semanal | mensual
  const [variable, setVariable] = useState("methane"); // methane | vibration
  const [sensor, setSensor] = useState("");
  const [data, setData] = useState([]);
  const [kpis, setKpis] = useState({});
  const [metricas, setMetricas] = useState({});

  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // ============================
  // 🔍 Sensores disponibles según variable
  // ============================
  const sensoresDisponibles = useMemo(() => {
    const fuente = variable === "methane" ? methaneJSON : vibrationJSON;
    return Object.keys(fuente);
  }, [variable]);

  // Cambia sensor automáticamente al cambiar variable
  useEffect(() => {
    setSensor(sensoresDisponibles[0] || "");
  }, [sensoresDisponibles]);

  // Volver a procesar datos cuando cambien los selectores
  useEffect(() => {
    procesarDatos();
  }, [modo, variable, sensor]);

  const obtenerJSON = () =>
    variable === "methane" ? methaneJSON : vibrationJSON;

  // ============================
  // 🔄 PROCESAR DATOS
  // ============================
  const procesarDatos = () => {
    // No existe predicción mensual → solo mensaje
    if (modo === "mensual") {
      setData([]);
      setKpis({});
      setMetricas({});
      return;
    }

    const fuenteJSON = obtenerJSON();
    const sensorData = fuenteJSON[sensor];
    if (!sensorData) return;

    // Predicciones vienen como OBJETO → convertir a ARRAY
    const predObj = sensorData.predicciones_semana_siguiente;

    const procesado = Object.entries(predObj).map(([fecha, valor]) => {
      const fechaObj = new Date(fecha);
      const diaNombre = diasSemana[fechaObj.getDay()];

      return {
        fecha: `${fecha} (${diaNombre})`,
        valor,
        min: valor * 0.9,
        max: valor * 1.1,
        clasificacion: "sin clasificación",
      };
    });

    setData(procesado);
    generarKPIs(procesado);

    // Guardar métricas reales
    setMetricas(sensorData.metricas || {});
  };

  const generarKPIs = (registros) => {
    if (!registros.length) return;

    const valores = registros.map((d) => d.valor);

    setKpis({
      promedio: (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(3),
      minimo: Math.min(...valores).toFixed(3),
      maximo: Math.max(...valores).toFixed(3),
    });
  };

  // ============================
  // 🔥 UMBRAL CRÍTICO
  // ============================
  const UMBRAL = variable === "methane" ? 1.0 : 10.0; // Puedes ajustar luego

  return (
    <div className="dashboard">
      <h2>🏗️ Proyección Soterrado</h2>

      {/* ============================
          SELECTORES
      ============================ */}
      <div className="modo-selector">

        {/* Variable */}
        <label>Variable:</label>
        <select value={variable} onChange={(e) => setVariable(e.target.value)}>
          <option value="methane">Metano</option>
          <option value="vibration">Vibración</option>
        </select>

        {/* Sensor */}
        <label>Sensor:</label>
        <select value={sensor} onChange={(e) => setSensor(e.target.value)}>
          {sensoresDisponibles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Modo */}
        <label>Proyección:</label>
        <select value={modo} onChange={(e) => setModo(e.target.value)}>
          <option value="semanal">Semanal</option>
          <option value="mensual">Mensual</option>
        </select>
      </div>

      {/* ============================
          MENSAJE MENSUAL
      ============================ */}
      {modo === "mensual" && (
        <div className="alerta-mensaje">
          ⚠️ <b>La regresión lineal no puede predecir un mes completo.</b><br />
          Solo existen predicciones de 7 días.
        </div>
      )}

      {/* ============================
          KPIS SEMANALES
      ============================ */}
      {modo === "semanal" && (
        <div className="kpi-grid">

          <div className="kpi-card">
            <h4>📊 Promedio</h4>
            <p>{kpis.promedio}</p>
          </div>

          <div className="kpi-card">
            <h4>🔼 Máximo</h4>
            <p>{kpis.maximo}</p>
          </div>

          <div className="kpi-card">
            <h4>🔽 Mínimo</h4>
            <p>{kpis.minimo}</p>
          </div>

          {/* Métricas reales */}
          <div className="kpi-card">
            <h4>🤖 Métricas del Modelo</h4>
            <p>R²: {metricas.r2?.toFixed(4)}</p>
            <p>RMSE: {metricas.rmse?.toFixed(4)}</p>
            <p>MAE: {metricas.mae?.toFixed(4)}</p>
          </div>

        </div>
      )}

      {/* ============================
          GRÁFICA SEMANAL
      ============================ */}
      {modo === "semanal" && (
        <>
          <h3>📅 Proyección Semanal — {sensor} ({variable})</h3>
          <div className="grafica-container">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="sotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9c27b0" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9c27b0" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />

                {/* 🔴 UMBRAL */}
                <ReferenceLine
                  y={UMBRAL}
                  stroke="red"
                  strokeWidth={2}
                  label={{
                    value: `Umbral crítico (${UMBRAL})`,
                    position: "right",
                    fill: "red",
                    fontSize: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="max"
                  stroke="#ab47bc"
                  fill="url(#sotGrad)"
                  name="Máximo"
                />

                <Area
                  type="monotone"
                  dataKey="min"
                  stroke="#ce93d8"
                  fill="url(#sotGrad)"
                  name="Mínimo"
                />

                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#6a1b9a"
                  strokeWidth={3}
                  dot={false}
                  name="Predicción"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
