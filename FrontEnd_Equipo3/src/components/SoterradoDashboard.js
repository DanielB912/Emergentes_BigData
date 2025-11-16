import React, { useEffect, useState, useRef } from "react";
import { Line, Bar, Pie, Scatter } from "react-chartjs-2";
import Papa from "papaparse";
import { socket } from "../socket";
import SidebarFiltrosAvanzado from "./SidebarFiltrosAvanzado";
import {
  Chart,
  LineElement,
  BarElement,
  ArcElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

Chart.register(
  LineElement,
  BarElement,
  ArcElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

function SoterradoDashboard({ role }) {
  const [data, setData] = useState([]);
  const [filtros, setFiltros] = useState({
    desde: new Date(),
    hasta: new Date(),
    variable: "vibration",
    sensor: "todos",
    chartType: "todos",
  });
  const chartRef = useRef(null);
  const [source, setSource] = useState("Simulado");
  const [sensores, setSensores] = useState([]);

  // --- LECTURA CSV ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        const parsed = result.data
          .filter((row) => row["deviceInfo.deviceName"])
          .map((row) => ({
            device: row["deviceInfo.deviceName"],
            time: row.time || new Date().toISOString(),
            object: {
              vibration: row.vibration || Math.random() * 100,
              moisture: row.moisture || Math.random() * 30 + 40,
              methane: row.methane || Math.random() * 10,
              temperature: row.temperature || Math.random() * 10 + 20,
            },
          }));
        setData(parsed);
        setSource("CSV");
        setSensores([...new Set(parsed.map((d) => d.device))]);
      },
    });
  };

  // --- DATOS SIMULADOS O SOCKET ---
  useEffect(() => {
    let interval;
    try {
      socket.on("nuevoDatoSoterrado", (dato) => {
        setData((prev) => [...prev.slice(-99), dato]);
        setSource("Tiempo Real");
      });
      interval = setInterval(() => {
        if (source === "Simulado") {
          const simul = {
            device: "EM310-" + Math.floor(900 + Math.random() * 99),
            time: new Date().toISOString(),
            object: {
              vibration: (Math.random() * 100).toFixed(2),
              moisture: (40 + Math.random() * 30).toFixed(2),
              methane: (Math.random() * 10).toFixed(2),
              temperature: (15 + Math.random() * 10).toFixed(2),
            },
          };
          setData((prev) => [...prev.slice(-99), simul]);
          if (!sensores.includes(simul.device))
            setSensores((prev) => [...new Set([...prev, simul.device])]);
        }
      }, 1500);
    } catch {
      console.warn("⚠️ Sin conexión al backend, simulando...");
    }
    return () => {
      socket.off("nuevoDatoSoterrado");
      clearInterval(interval);
    };
  }, [source]);

  // === FILTROS ===
  const datosFiltrados =
    filtros.sensor === "todos"
      ? data
      : data.filter((d) => d.device === filtros.sensor);

  const labels = datosFiltrados.map((d) =>
    new Date(d.time).toLocaleTimeString()
  );

  // === DATASETS ===
  const vibTrend = {
    labels,
    datasets:
      filtros.sensor === "todos"
        ? sensores.map((s, i) => ({
            label: `Vibración (${s})`,
            data: datosFiltrados
              .filter((d) => d.device === s)
              .map((d) => d.object.vibration),
            borderColor: ["#64ffda", "#ffa600", "#42a5f5", "#ff5252", "#ab47bc"][
              i % 5
            ],
            tension: 0.4,
            fill: false,
          }))
        : [
            {
              label: `Vibración (${filtros.sensor})`,
              data: datosFiltrados.map((d) => d.object.vibration),
              borderColor: "#64ffda",
              tension: 0.4,
              fill: false,
            },
          ],
  };

  const humedadTemp = {
    labels,
    datasets: [
      {
        label: "Humedad Suelo (%)",
        data: datosFiltrados.map((d) => d.object.moisture),
        borderColor: "#42a5f5",
        tension: 0.4,
        fill: false,
      },
      {
        label: "Temp Suelo (°C)",
        data: datosFiltrados.map((d) => d.object.temperature),
        borderColor: "#ffa600",
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const histVibration = {
    labels: ["0-20", "20-40", "40-60", "60-80", "80-100"],
    datasets: [
      {
        label: "Frecuencia Vibración",
        data: [3, 8, 10, 7, 4],
        backgroundColor: "#64ffda",
      },
    ],
  };

  const pieMethane = {
    labels: ["Bajo (0-3 ppm)", "Medio (3-6 ppm)", "Alto (6-10 ppm)"],
    datasets: [
      {
        label: "Metano",
        data: [
          datosFiltrados.filter((d) => d.object.methane < 3).length,
          datosFiltrados.filter(
            (d) => d.object.methane >= 3 && d.object.methane <= 6
          ).length,
          datosFiltrados.filter((d) => d.object.methane > 6).length,
        ],
        backgroundColor: ["#42a5f5", "#ffa600", "#ff5252"],
      },
    ],
  };

  const scatterVM = {
    datasets: [
      {
        label: "Vibración vs Metano",
        data: datosFiltrados.map((d) => ({
          x: d.object.vibration,
          y: d.object.methane,
        })),
        backgroundColor: "#ffa600",
      },
    ],
  };

  const corrScatter = {
    datasets: [
      {
        label: "Humedad vs Temperatura",
        data: datosFiltrados.map((d) => ({
          x: d.object.moisture,
          y: d.object.temperature,
        })),
        backgroundColor: "#64ffda",
      },
    ],
  };

  const avgSummary = {
    labels: sensores,
    datasets: [
      {
        label: "Promedio Vibración",
        data: sensores.map(
          (s) =>
            datosFiltrados
              .filter((d) => d.device === s)
              .reduce((sum, d) => sum + parseFloat(d.object.vibration || 0), 0) /
            (datosFiltrados.filter((d) => d.device === s).length || 1)
        ),
        backgroundColor: "#45d5c1",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: { display: true, text: "Análisis Sensor Soterrado" },
      zoom: {
        zoom: { wheel: { enabled: true }, mode: "x" },
        pan: { enabled: true, mode: "x" },
      },
      legend: { position: "top" },
    },
  };

  // === ORDEN DINÁMICO DE GRÁFICOS ===
  const todosLosGraficos = [
    { tipo: "line", componente: <Line ref={chartRef} data={vibTrend} options={options} /> },
    { tipo: "line", componente: <Line data={humedadTemp} options={options} /> },
    { tipo: "bar", componente: <Bar data={histVibration} options={options} /> },
    { tipo: "pie", componente: <Pie data={pieMethane} options={options} /> },
    { tipo: "scatter", componente: <Scatter data={scatterVM} options={options} /> },
    { tipo: "scatter", componente: <Scatter data={corrScatter} options={options} /> },
    { tipo: "bar", componente: <Bar data={avgSummary} options={options} /> },
  ];

  const graficosFiltrados =
    filtros.chartType === "todos"
      ? todosLosGraficos
      : [
          ...todosLosGraficos.filter((g) => g.tipo === filtros.chartType),
          ...todosLosGraficos.filter((g) => g.tipo !== filtros.chartType),
        ];

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {role === "ejecutivo" && (
        <SidebarFiltrosAvanzado
          filtros={filtros}
          setFiltros={setFiltros}
          sensores={sensores}
          role={role}
          onResetZoom={() => chartRef.current?.resetZoom()}
        />
      )}

      <div style={{ flex: 1 }}>
        <h2>🌍 Sensor Soterrado</h2>
        <p style={{ color: "gray" }}>🔁 Fuente: {source}</p>
        <input type="file" accept=".csv" onChange={handleFileUpload} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "25px",
            marginTop: "20px",
          }}
        >
          {graficosFiltrados.map((g, i) => (
            <div key={i} style={card}>
              {g.componente}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const card = { backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 };
export default SoterradoDashboard;
