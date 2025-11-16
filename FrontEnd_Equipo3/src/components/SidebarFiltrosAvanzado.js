import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function SidebarFiltrosAvanzado({
  filtros,
  setFiltros,
  onAplicar = () => {},
  onResetZoom = () => {},
  sensores = [],
  role,
}) {
  const [desde, setDesde] = useState(filtros.desde);
  const [hasta, setHasta] = useState(filtros.hasta);
  const [variable, setVariable] = useState(filtros.variable);
  const [sensor, setSensor] = useState(filtros.sensor || "todos");
  const [tipoSensor, setTipoSensor] = useState("aire");
  const [chartType, setChartType] = useState(filtros.chartType || "todos");

  // detectar tipo de sensor automáticamente
  useEffect(() => {
    if (["temperature", "humidity", "co2", "pressure"].includes(variable))
      setTipoSensor("aire");
    else if (["laeq", "laimax", "battery"].includes(variable))
      setTipoSensor("sonido");
    else if (["vibration", "moisture", "methane", "temperature"].includes(variable))
      setTipoSensor("soterrado");
  }, [variable]);

  const aplicarFiltros = () => {
    setFiltros({ ...filtros, desde, hasta, variable, sensor, chartType });
    onAplicar();
  };

  const variablesPorTipo = {
    aire: [
      { value: "temperature", label: "Temperatura (°C)" },
      { value: "humidity", label: "Humedad (%)" },
      { value: "co2", label: "CO₂ (ppm)" },
      { value: "pressure", label: "Presión (hPa)" },
    ],
    sonido: [
      { value: "laeq", label: "Ruido LAeq (dB)" },
      { value: "laimax", label: "Ruido Máx (dB)" },
      { value: "battery", label: "Nivel de Batería (%)" },
    ],
    soterrado: [
      { value: "vibration", label: "Vibración (Hz)" },
      { value: "moisture", label: "Humedad del Suelo (%)" },
      { value: "methane", label: "Metano (ppm)" },
      { value: "temperature", label: "Temperatura del Suelo (°C)" },
    ],
  };

  // 🔹 ahora incluye "todos"
  const chartOptions = [
    { value: "todos", label: "📊 Todos los gráficos" },
    { value: "line", label: "📈 Línea" },
    { value: "bar", label: "📊 Barras" },
    { value: "pie", label: "🥧 Torta" },
    { value: "scatter", label: "🔹 Dispersión" },
  ];

  return (
    <div
      style={{
        backgroundColor: "#1e1e1e",
        color: "white",
        padding: "22px",
        borderRadius: "12px",
        width: "280px",
        minWidth: "270px",
        boxShadow: "0 0 10px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3 style={{ color: "#64ffda", marginBottom: "15px" }}>📊 Filtros Avanzados</h3>

      <label style={labelStyle}>Desde:</label>
      <DatePicker
        selected={desde}
        onChange={(date) => setDesde(date)}
        dateFormat="MM/dd/yyyy"
        className="date-picker"
      />

      <label style={labelStyle}>Hasta:</label>
      <DatePicker
        selected={hasta}
        onChange={(date) => setHasta(date)}
        dateFormat="MM/dd/yyyy"
        className="date-picker"
      />

      {role === "ejecutivo" && (
        <>
          <label style={labelStyle}>Variable:</label>
          <select
            value={variable}
            onChange={(e) => setVariable(e.target.value)}
            style={selectStyle}
          >
            {variablesPorTipo[tipoSensor].map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Sensor:</label>
          <select
            value={sensor}
            onChange={(e) => setSensor(e.target.value)}
            style={selectStyle}
          >
            <option value="todos">Todos</option>
            {sensores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Tipo de gráfico:</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            style={selectStyle}
          >
            {chartOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </>
      )}

      <button onClick={aplicarFiltros} style={btnAplicar}>
        Aplicar
      </button>

      <button onClick={onResetZoom} style={btnZoom}>
        🔍 Reset Zoom
      </button>
    </div>
  );
}

// estilos reutilizables
const labelStyle = { fontWeight: "bold", marginTop: "10px", marginBottom: "4px" };

const selectStyle = {
  width: "100%",
  padding: "6px",
  backgroundColor: "#2c2c2c",
  color: "white",
  border: "1px solid #64ffda",
  borderRadius: "5px",
  marginBottom: "8px",
};

const btnAplicar = {
  backgroundColor: "#64ffda",
  color: "black",
  fontWeight: "bold",
  width: "100%",
  padding: "9px",
  marginTop: "15px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const btnZoom = {
  backgroundColor: "#333",
  color: "#64ffda",
  width: "100%",
  padding: "9px",
  marginTop: "10px",
  border: "1px solid #64ffda",
  borderRadius: "5px",
  cursor: "pointer",
};

export default SidebarFiltrosAvanzado;
