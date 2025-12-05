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
  const [fullscreenChart, setFullscreenChart] = useState(null);

  const openFullScreen = (chart) => setFullscreenChart(chart);
  const closeFullScreen = () => setFullscreenChart(null);

  // === LECTURA CSV / XLSX ===
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();

    if (extension === "csv") {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (result) => {
          const parsed = result.data
            .filter((row) => row["deviceInfo.deviceName"] || row.sensor_id)
            .map((row) => ({
              device:
                row["deviceInfo.deviceName"] ||
                `sensor_aire_${row.sensor_id || 1}`,
              time: row.time || row.fecha_hora || new Date().toISOString(),
              object: {
                temperature: parseFloat(row.temperature) || 0,
                humidity: parseFloat(row.humidity) || 0,
                co2: parseFloat(row.co2) || 0,
                pressure: parseFloat(row.pressure) || 0,
              },
            }));
          setData(parsed);
          setSensores([...new Set(parsed.map((d) => d.device))]);
          setSource("Archivo CSV");
        },
      });
    } else if (extension === "xlsx") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const parsed = rows.map((row) => ({
          device: `sensor_aire_${row.sensor_id || 1}`,
          time: row.fecha_hora || new Date().toISOString(),
          object: {
            temperature: parseFloat(row.temperature) || 0,
            humidity: parseFloat(row.humidity) || 0,
            co2: parseFloat(row.co2) || 0,
            pressure: parseFloat(row.pressure) || 0,
          },
        }));

        setData(parsed);
        setSensores([...new Set(parsed.map((d) => d.device))]);
        setSource("Archivo XLSX");
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Formato no soportado. Usa CSV o XLSX.");
    }
  };

  // === DATOS EN TIEMPO REAL (SOCKET) ===
  useEffect(() => {
    socket.on("aire_update", (datoNuevo) => {
      if (source === "Simulado" || source === "Tiempo Real") {
        setData((prev) => [...prev, datoNuevo]);
        setSource("Tiempo Real");
      }
    });
    return () => socket.off("aire_update");
  }, [source]);

  // === FILTROS ===
  const datosFiltrados =
    filtros.sensor === "todos"
      ? data
      : data.filter((d) => d.device === filtros.sensor);

  const labels = datosFiltrados
    .filter((d) => d && d.time)
    .map((d) => new Date(d.time).toLocaleTimeString());

  // === 1️⃣ EVOLUCIÓN TEMPERATURA Y HUMEDAD ===
  const tempTrend = {
    labels,
    datasets: [
      {
        label: "Temperatura (°C)",
        data: datosFiltrados
          .filter((d) => d.object?.temperature)
          .map((d) => d.object.temperature),
        borderColor: "#ffa600",
        tension: 0.4,
      },
      {
        label: "Humedad (%)",
        data: datosFiltrados
          .filter((d) => d.object?.humidity)
          .map((d) => d.object.humidity),
        borderColor: "#42a5f5",
        tension: 0.4,
      },
    ],
  };

  // === 2️⃣ PROMEDIO POR SENSOR ===
  const sensoresUnicos = [
    ...new Set(
      data
        .map((d) => d.device_name || d.device)
        .filter((x) => typeof x === "string" && x.trim() !== "")
    ),
  ];

  const avgTemp = {
    labels: sensoresUnicos.length > 0 ? sensoresUnicos : ["Sin datos"],
    datasets: [
      {
        label: "Promedio de Temperatura (°C)",
        data: sensoresUnicos.map((s) => {
          const valores = data
            .filter(
              (d) =>
                (d.device_name === s || d.device === s) &&
                d.object?.temperature != null
            )
            .map((d) => parseFloat(d.object.temperature));
          return valores.length > 0
            ? valores.reduce((a, b) => a + b, 0) / valores.length
            : 0;
        }),
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
        label: "Límite Superior (1300ppm)",
        data: new Array(labels.length).fill(1300),
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

  // === EXPORTAR EXCEL ===
  const exportToExcel = (index) => {
    const chart = charts[index];
    const chartData = chart.componente.props.data;
    const labels = chartData.labels || [];
    const datasets = chartData.datasets || [];
    let headers = [];
    let rows = [];

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

    XLSX.writeFile(
      workbook,
      `grafico_${index + 1}_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`
    );
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
        <input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} />

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
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "15px",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => exportToExcel(i)}
                  style={{
                    padding: "10px 20px",
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Descargar Reporte
                </button>
                <button
                  onClick={() => openFullScreen(g.componente)}
                  style={{
                    padding: "10px 20px",
                    background: "#2196f3",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Pantalla Completa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {fullscreenChart && (
        <FullScreenChart chart={fullscreenChart} onClose={closeFullScreen} />
      )}
    </div>
  );
}

const card = { backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 };
export default AireDashboard;
