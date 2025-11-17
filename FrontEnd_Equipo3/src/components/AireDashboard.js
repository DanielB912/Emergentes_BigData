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

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// 🔥 NUEVO: Importar Pantalla Completa
import FullScreenChart from "./FullScreenChart";

function AireDashboard({ role }) {
  const [data, setData] = useState([]);
  const [filtros, setFiltros] = useState({
    desde: new Date(),
    hasta: new Date(),
    variable: "temperature",
    sensor: "todos",
    chartType: "todos",
  });
  const chartRef = useRef(null);
  const [source, setSource] = useState("Simulado");
  const [sensores, setSensores] = useState([]);

  // ⭐⭐⭐ NUEVO: Estado de pantalla completa ⭐⭐⭐
  const [fullscreenChart, setFullscreenChart] = useState(null);

  const openFullScreen = (chart) => {
    setFullscreenChart(chart);
  };

  const closeFullScreen = () => {
    setFullscreenChart(null);
  };

  // === LECTURA CSV ===
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
              temperature: row.temperature || Math.random() * 10 + 20,
              humidity: row.humidity || Math.random() * 30 + 40,
              co2: row.co2 || Math.random() * 300 + 400,
              pressure: row.pressure || Math.random() * 20 + 1000,
            },
          }));
        setData(parsed);
        setSensores([...new Set(parsed.map((d) => d.device))]);
        setSource("CSV");
      },
    });
  };

  // === DATOS SIMULADOS / SOCKET ===
  useEffect(() => {
    let interval;
    try {
      socket.on("nuevoDatoAire", (dato) => {
        setData((prev) => [...prev.slice(-99), dato]);
        setSource("Tiempo Real");
      });
      interval = setInterval(() => {
        if (source === "Simulado") {
          const simul = {
            device: "CO2-" + Math.floor(1000 + Math.random() * 9000),
            time: new Date().toISOString(),
            object: {
              temperature: (20 + Math.random() * 10).toFixed(2),
              humidity: (40 + Math.random() * 30).toFixed(2),
              co2: (400 + Math.random() * 200).toFixed(2),
              pressure: (1000 + Math.random() * 30).toFixed(2),
            },
          };
          setData((prev) => [...prev.slice(-99), simul]);
          if (!sensores.includes(simul.device))
            setSensores((prev) => [...new Set([...prev, simul.device])]);
        }
      }, 1500);
    } catch {
      console.warn("Sin conexión al backend, simulando...");
    }
    return () => {
      socket.off("nuevoDatoAire");
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

  // === 1️⃣ EVOLUCIÓN TEMPERATURA Y HUMEDAD ===
  const tempTrend = {
    labels,
    datasets: [
      {
        label: "Temperatura (°C)",
        data: datosFiltrados.map((d) => d.object.temperature),
        borderColor: "#ffa600",
        tension: 0.4,
      },
      {
        label: "Humedad (%)",
        data: datosFiltrados.map((d) => d.object.humidity),
        borderColor: "#42a5f5",
        tension: 0.4,
      },
    ],
  };

  // === 2️⃣ PROMEDIO POR SENSOR ===
  const avgTemp = {
    labels: sensores,
    datasets: [
      {
        label: "Promedio de Temperatura (°C)",
        data: sensores.map(
          (s) =>
            datosFiltrados
              .filter((d) => d.device === s)
              .reduce((sum, d) => sum + parseFloat(d.object.temperature || 0), 0) /
            (datosFiltrados.filter((d) => d.device === s).length || 1)
        ),
        backgroundColor: "#64ffda",
      },
    ],
  };

  // === 3️⃣ DISTRIBUCIÓN CO₂ ===
  const pieCO2 = {
    labels: ["Bajo (<500ppm)", "Medio (500-600ppm)", "Alto (>600ppm)"],
    datasets: [
      {
        data: [
          datosFiltrados.filter((d) => d.object.co2 < 500).length,
          datosFiltrados.filter(
            (d) => d.object.co2 >= 500 && d.object.co2 <= 600
          ).length,
          datosFiltrados.filter((d) => d.object.co2 > 600).length,
        ],
        backgroundColor: ["#42a5f5", "#ffa600", "#ff5252"],
      },
    ],
  };

  // === 4️⃣ CONTROL 6σ (CO₂) ===
  const controlCO2 = {
    labels,
    datasets: [
      {
        label: "Concentración CO₂ (ppm)",
        data: datosFiltrados.map((d) => d.object.co2),
        borderColor: "#64ffda",
        tension: 0.3,
      },
      {
        label: "Límite Superior (600ppm)",
        data: new Array(labels.length).fill(600),
        borderColor: "#ff5252",
        borderDash: [6, 6],
      },
      {
        label: "Límite Inferior (400ppm)",
        data: new Array(labels.length).fill(400),
        borderColor: "#9ccc65",
        borderDash: [6, 6],
      },
    ],
  };

  // === 5️⃣ CORRELACIÓN TEMP vs HUMEDAD ===
  const scatterTH = {
    datasets: [
      {
        label: "Temperatura vs Humedad",
        data: datosFiltrados.map((d) => ({
          x: d.object.temperature,
          y: d.object.humidity,
        })),
        backgroundColor: "#ab47bc",
      },
    ],
  };

  const baseOptions = (title, x, y) => ({
    responsive: true,
    plugins: {
      title: { display: true, text: title, color: "#fff" },
      legend: { labels: { color: "#ccc" } },
    },
    scales: {
      x: { title: { display: true, text: x, color: "#ccc" } },
      y: { title: { display: true, text: y, color: "#ccc" } },
    },
  });

  const charts = [
    { tipo: "line", componente: <Line data={tempTrend} options={baseOptions("Evolución de Temperatura y Humedad", "Tiempo", "Valor")} /> },
    { tipo: "bar", componente: <Bar data={avgTemp} options={baseOptions("Promedio de Temperatura por Sensor", "Sensor", "°C")} /> },
    { tipo: "pie", componente: <Pie data={pieCO2} options={baseOptions("Distribución de CO₂", "", "")} /> },
    { tipo: "line", componente: <Line data={controlCO2} options={baseOptions("Gráfico de Control de CO₂ (6σ)", "Tiempo", "ppm")} /> },
    { tipo: "scatter", componente: <Scatter data={scatterTH} options={baseOptions("Relación entre Temperatura y Humedad", "Temperatura (°C)", "Humedad (%)")} /> },
  ];

  const exportToExcel = (index) => {
    const chart = charts[index];
    const chartData = chart.componente.props.data;

    let headers = [];
    let rows = [];

    const labels = chartData.labels || [];
    const datasets = chartData.datasets || [];

    const isScatter =
      datasets.length > 0 &&
      Array.isArray(datasets[0].data) &&
      typeof datasets[0].data[0] === "object" &&
      datasets[0].data[0] !== null &&
      "x" in datasets[0].data[0] &&
      "y" in datasets[0].data[0];

    if (!isScatter) {
      headers = ["Label", ...datasets.map((d) => d.label)];

      rows = labels.map((label, i) => {
        const row = [label];
        datasets.forEach((d) => row.push(d.data[i] ?? ""));
        return row;
      });
    } else {
      headers = ["Temperatura (°C)", "Humedad (%)"];
      rows = datasets[0].data.map((p) => [p.x, p.y]);
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

    const now = new Date();
    const formatted =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0") +
      "_" +
      String(now.getHours()).padStart(2, "0") +
      "-" +
      String(now.getMinutes()).padStart(2, "0") +
      "-" +
      String(now.getSeconds()).padStart(2, "0");

    XLSX.writeFile(workbook, `grafico_${index + 1}_${formatted}.xlsx`);
  };

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
        <h2>🌫️ Sensor de Aire</h2>
        <p style={{ color: "gray" }}>Fuente: {source}</p>
        <input type="file" accept=".csv" onChange={handleFileUpload} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "25px",
            marginTop: "20px",
          }}
        >
          {charts.map((g, i) => (
            <div key={i} style={card}>
              {g.componente}

              {/* BOTONES */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "15px",
                  gap: "10px",
                }}
              >
                {/* BOTÓN ORIGINAL */}
                <button
                  onClick={() => exportToExcel(i)}
                  style={{
                    padding: "10px 20px",
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Descargar Reporte
                </button>

                {/* ⭐ NUEVO: BOTÓN PANTALLA COMPLETA */}
                <button
                  onClick={() => openFullScreen(g.componente)}
                  style={{
                    padding: "10px 20px",
                    background: "#2196f3",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Pantalla Completa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ⭐⭐⭐ MODAL DE PANTALLA COMPLETA ⭐⭐⭐ */}
      {fullscreenChart && (
        <FullScreenChart chart={fullscreenChart} onClose={closeFullScreen} />
      )}
    </div>
  );
}

const card = { backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 };
export default AireDashboard;
