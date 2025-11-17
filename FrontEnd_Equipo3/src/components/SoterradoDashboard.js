import React, { useEffect, useState, useRef } from "react";
import { Line, Bar, Pie, Scatter } from "react-chartjs-2";
import Papa from "papaparse";
import { socket } from "../socket";
import SidebarFiltrosAvanzado from "./SidebarFiltrosAvanzado";
import FullScreenChart from "./FullScreenChart"; // ⬅️ AGREGADO

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

  // === ESTADO PARA PANTALLA COMPLETA ===
  const [fullscreenChart, setFullscreenChart] = useState(null);

  const handleFileUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    Papa.parse(f, {
      header: true,
      dynamicTyping: true,
      complete: (r) => {
        const parsed = r.data
          .filter((x) => x["deviceInfo.deviceName"])
          .map((x) => ({
            device: x["deviceInfo.deviceName"],
            time: x.time || new Date().toISOString(),
            object: {
              vibration: x.vibration || Math.random() * 100,
              moisture: x.moisture || Math.random() * 30 + 40,
              methane: x.methane || Math.random() * 10,
              temperature: x.temperature || Math.random() * 10 + 20,
            },
          }));
        setData(parsed);
        setSensores([...new Set(parsed.map((d) => d.device))]);
        setSource("CSV");
      },
    });
  };

  useEffect(() => {
    let i;
    try {
      socket.on("nuevoDatoSoterrado", (d) => {
        setData((p) => [...p.slice(-99), d]);
        setSource("Tiempo Real");
      });

      i = setInterval(() => {
        if (source === "Simulado") {
          const s = {
            device: "EM310-" + Math.floor(900 + Math.random() * 99),
            time: new Date().toISOString(),
            object: {
              vibration: (Math.random() * 100).toFixed(2),
              moisture: (40 + Math.random() * 30).toFixed(2),
              methane: (Math.random() * 10).toFixed(2),
              temperature: (15 + Math.random() * 10).toFixed(2),
            },
          };

          setData((p) => [...p.slice(-99), s]);
          if (!sensores.includes(s.device))
            setSensores((p) => [...new Set([...p, s.device])]);
        }
      }, 1500);
    } catch {
      console.warn("Simulando...");
    }

    return () => {
      socket.off("nuevoDatoSoterrado");
      clearInterval(i);
    };
  }, [source]);

  const datos =
    filtros.sensor === "todos"
      ? data
      : data.filter((d) => d.device === filtros.sensor);

  const labels = datos.map((d) => new Date(d.time).toLocaleTimeString());

  const vibTrend = {
    labels,
    datasets: [
      {
        label: "Vibración (%)",
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

  const avgVib = {
    labels: sensores,
    datasets: [
      {
        label: "Promedio Vibración (%)",
        data: sensores.map(
          (s) =>
            datos
              .filter((d) => d.device === s)
              .reduce(
                (sum, d) => sum + parseFloat(d.object.vibration || 0),
                0
              ) /
            (datos.filter((d) => d.device === s).length || 1)
        ),
        backgroundColor: "#26c6da",
      },
    ],
  };

  const pieMethane = {
    labels: ["Bajo (0-3ppm)", "Medio (3-6ppm)", "Alto (>6ppm)"],
    datasets: [
      {
        data: [
          datos.filter((d) => d.object.methane < 3).length,
          datos.filter((d) => d.object.methane >= 3 && d.object.methane <= 6)
            .length,
          datos.filter((d) => d.object.methane > 6).length,
        ],
        backgroundColor: ["#42a5f5", "#ffa600", "#ff5252"],
      },
    ],
  };

  const controlVib = {
    labels,
    datasets: [
      {
        label: "Vibración (%)",
        data: datos.map((d) => d.object.vibration),
        borderColor: "#64ffda",
        tension: 0.3,
      },
      {
        label: "Límite Superior (80%)",
        data: new Array(labels.length).fill(80),
        borderColor: "#ff5252",
        borderDash: [6, 6],
      },
      {
        label: "Límite Inferior (20%)",
        data: new Array(labels.length).fill(20),
        borderColor: "#9ccc65",
        borderDash: [6, 6],
      },
    ],
  };

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
          options={baseOpt("Promedio de Vibración por Sensor", "Sensor", "%")}
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
          options={baseOpt("Gráfico de Control (6σ) de Vibración", "Tiempo", "%")}
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
            "Vibración (%)",
            "Humedad (%)"
          )}
        />
      ),
    },
  ];

  // ============================
  // EXPORTAR EXCEL
  // ============================
  const exportToExcel = (index) => {
    const chart = grafs[index];

    let headers = [];
    let rows = [];

    const chartData = chart.componente.props.data;
    const labels = chartData.labels || [];
    const datasets = chartData.datasets || [];

    if (chart.tipo === "scatter") {
      headers = ["Vibración (%)", "Humedad (%)"];
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

        <input type="file" accept=".csv" onChange={handleFileUpload} />

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

              {/* BOTONES */}
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

      {/* MODAL DE PANTALLA COMPLETA */}
      {fullscreenChart && (
        <FullScreenChart
          chart={fullscreenChart}
          onClose={() => setFullscreenChart(null)}
        />
      )}
    </div>
  );
}

const card = {
  backgroundColor: "#1e1e1e",
  padding: 20,
  borderRadius: 10,
};

export default SoterradoDashboard;
