import React, { useEffect, useState, useRef } from "react";
import { Line, Bar, Pie, Scatter } from "react-chartjs-2";
import Papa from "papaparse";
import { socket } from "../socket";
import SidebarFiltrosAvanzado from "./SidebarFiltrosAvanzado";
import FullScreenChart from "./FullScreenChart";

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
import * as XLSX from "xlsx";

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
  const [fullscreenChart, setFullscreenChart] = useState(null);

  // === LECTURA CSV / XLSX ===
  const handleFileUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const extension = f.name.split(".").pop().toLowerCase();

    if (extension === "csv") {
      Papa.parse(f, {
        header: true,
        dynamicTyping: true,
        complete: (r) => {
          const parsed = r.data
            .filter((x) => x["deviceInfo.deviceName"] || x.sensor_id)
            .map((x) => ({
              device:
                x["deviceInfo.deviceName"] ||
                `sensor_soterrado_${x.sensor_id || 1}`,
              time: x.time || x.fecha_hora || new Date().toISOString(),
              object: {
                vibration: parseFloat(x.vibration) || 0,
                moisture: parseFloat(x.moisture) || 0,
                methane: parseFloat(x.methane) || 0,
                temperature: parseFloat(x.temperature) || 0,
                status: x.status || "OK",
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
          device: `sensor_soterrado_${row.sensor_id || 1}`,
          time: row.fecha_hora || new Date().toISOString(),
          object: {
            vibration: parseFloat(row.vibration) || 0,
            moisture: parseFloat(row.moisture) || 0,
            methane: parseFloat(row.methane) || 0,
            temperature: parseFloat(row.temperature) || 0,
            status: row.status || "OK",
          },
        }));

        setData(parsed);
        setSensores([...new Set(parsed.map((d) => d.device))]);
        setSource("Archivo XLSX");
      };
      reader.readAsBinaryString(f);
    } else {
      alert("Formato no soportado. Usa CSV o XLSX.");
    }
  };

  // === SOCKET: DATOS EN TIEMPO REAL ===
  useEffect(() => {
    socket.on("soterrado_update", (datoNuevo) => {
      if (source === "Simulado" || source === "Tiempo Real") {
        setData((prev) => [...prev, datoNuevo]);
        setSource("Tiempo Real");
      }
    });
    return () => socket.off("soterrado_update");
  }, [source]);

  const datos =
    filtros.sensor === "todos"
      ? data
      : data.filter((d) => d.device === filtros.sensor);

  const labels = datos.map((d) =>
    new Date(d.time).toLocaleTimeString("es-BO")
  );

  // === 1️⃣ EVOLUCIÓN VIBRACIÓN Y TEMPERATURA ===
  const vibTrend = {
    labels,
    datasets: [
      {
        label: "Vibración (Hz)",
        data: datos.map((d) => d.object.vibration),
        borderColor: "#64ffda",
      },
      {
        label: "Temperatura (°C)",
        data: datos.map((d) => d.object.temperature),
        borderColor: "#ffa600",
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

  const avgVib = {
    labels: sensoresUnicos.length > 0 ? sensoresUnicos : ["Sin datos"],
    datasets: [
      {
        label: "Promedio de Vibración (Hz)",
        data: sensoresUnicos.map((s) => {
          const valores = data
            .filter(
              (d) =>
                (d.device_name === s || d.device === s) &&
                d.object?.vibration != null
            )
            .map((d) => parseFloat(d.object.vibration));
          return valores.length > 0
            ? valores.reduce((a, b) => a + b, 0) / valores.length
            : 0;
        }),
        backgroundColor: "#26c6da",
      },
    ],
  };

  // === 3️⃣ DISTRIBUCIÓN DE METANO ===
  const pieMethane = {
    labels: ["Bajo (0-3ppm)", "Medio (3-6ppm)", "Alto (>6ppm)"],
    datasets: [
      {
        data: [
          datos.filter((d) => d.object.methane < 3).length,
          datos.filter(
            (d) => d.object.methane >= 3 && d.object.methane <= 6
          ).length,
          datos.filter((d) => d.object.methane > 6).length,
        ],
        backgroundColor: ["#42a5f5", "#ffa600", "#ff5252"],
      },
    ],
  };

  // === 4️⃣ CONTROL DE VIBRACIÓN ===
  const controlVib = {
    labels,
    datasets: [
      {
        label: "Vibración (Hz)",
        data: datos.map((d) => d.object.vibration),
        borderColor: "#64ffda",
        tension: 0.3,
      },
      {
        label: "Límite Superior (10 Hz)",
        data: new Array(labels.length).fill(10),
        borderColor: "#ff5252",
        borderDash: [6, 6],
      },
      {
        label: "Límite Inferior (0 Hz)",
        data: new Array(labels.length).fill(0),
        borderColor: "#9ccc65",
        borderDash: [6, 6],
      },
    ],
  };

  // === 5️⃣ RELACIÓN VIBRACIÓN - HUMEDAD ===
  const scatterVH = {
    datasets: [
      {
        label: "Vibración vs Humedad",
        data: datos.map((d) => ({
          x: d.object.vibration,
          y: d.object.moisture,
        })),
        backgroundColor: "#ab47bc",
      },
    ],
  };

  const baseOpt = (t, x, y) => ({
    responsive: true,
    plugins: {
      title: { display: true, text: t, color: "#fff" },
      legend: { labels: { color: "#ccc" } },
    },
    scales: {
      x: { title: { display: true, text: x, color: "#ccc" } },
      y: { title: { display: true, text: y, color: "#ccc" } },
    },
  });

  const grafs = [
    {
      tipo: "line",
      componente: (
        <Line
          data={vibTrend}
          options={baseOpt(
            "Evolución de Vibración y Temperatura",
            "Tiempo",
            "Valor"
          )}
        />
      ),
    },
    {
      tipo: "bar",
      componente: (
        <Bar
          data={avgVib}
          options={baseOpt("Promedio de Vibración por Sensor", "Sensor", "Hz")}
        />
      ),
    },
    {
      tipo: "pie",
      componente: (
        <Pie
          data={pieMethane}
          options={baseOpt("Distribución de Niveles de Metano", "", "")}
        />
      ),
    },
    {
      tipo: "line",
      componente: (
        <Line
          data={controlVib}
          options={baseOpt("Gráfico de Control (6σ) de Vibración", "Tiempo", "Hz")}
        />
      ),
    },
    {
      tipo: "scatter",
      componente: (
        <Scatter
          data={scatterVH}
          options={baseOpt(
            "Relación entre Vibración y Humedad",
            "Vibración (Hz)",
            "Humedad (%)"
          )}
        />
      ),
    },
  ];

  // === EXPORTAR EXCEL ===
  const exportToExcel = (index) => {
    const chart = grafs[index];
    const chartData = chart.componente.props.data;
    const labels = chartData.labels || [];
    const datasets = chartData.datasets || [];
    let headers = [];
    let rows = [];

    if (chart.tipo === "scatter") {
      headers = ["Vibración (Hz)", "Humedad (%)"];
      rows = datasets[0].data.map((p) => [p.x, p.y]);
    } else {
      headers = ["Label", ...datasets.map((d) => d.label)];
      rows = labels.map((label, i) => {
        const row = [label];
        datasets.forEach((d) => row.push(d.data[i] ?? ""));
        return row;
      });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

    XLSX.writeFile(
      workbook,
      `grafico_${index + 1}_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.xlsx`
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
        <h2>🌍 Sensor Soterrado</h2>
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
          {grafs.map((g, i) => (
            <div key={i} style={card}>
              {g.componente}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  marginTop: "15px",
                }}
              >
                <button
                  onClick={() => setFullscreenChart(g.componente)}
                  style={{
                    background: "#2196f3",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Pantalla Completa
                </button>

                <button
                  onClick={() => exportToExcel(i)}
                  style={{
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Descargar Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {fullscreenChart && (
        <FullScreenChart
          chart={fullscreenChart}
          onClose={() => setFullscreenChart(null)}
        />
      )}
    </div>
  );
}

const card = { backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 };
export default SoterradoDashboard;
