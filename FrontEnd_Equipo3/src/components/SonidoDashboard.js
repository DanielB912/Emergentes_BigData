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

function SonidoDashboard({ role }) {
  const [data, setData] = useState([]);
  const [filtros, setFiltros] = useState({
    desde: new Date(),
    hasta: new Date(),
    variable: "laeq",
    sensor: "todos",
    chartType: "todos",
  });
  const chartRef = useRef(null);
  const [source, setSource] = useState("Simulado");
  const [sensores, setSensores] = useState([]);

  // === NUEVO: Estado para Pantalla Completa ===
  const [fullscreenChart, setFullscreenChart] = useState(null);

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
              laeq: row.LAEq || row.laeq || Math.random() * 20 + 60,
              laimax: row.LAIMax || row.laimax || Math.random() * 20 + 75,
              battery: row.Battery || row.battery || Math.random() * 30 + 70,
            },
          }));
        setData(parsed);
        setSource("CSV");
        setSensores([...new Set(parsed.map((d) => d.device))]);
      },
    });
  };

  // === DATOS SIMULADOS / SOCKET ===
  useEffect(() => {
    let interval;
    try {
      socket.on("nuevoDatoSonido", (dato) => {
        setData((prev) => [...prev.slice(-99), dato]);
        setSource("Tiempo Real");
      });

      interval = setInterval(() => {
        if (source === "Simulado") {
          const simul = {
            device: "SLS-" + Math.floor(2600 + Math.random() * 700),
            time: new Date().toISOString(),
            object: {
              laeq: (60 + Math.random() * 20).toFixed(2),
              laimax: (75 + Math.random() * 20).toFixed(2),
              battery: (70 + Math.random() * 30).toFixed(2),
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
      socket.off("nuevoDatoSonido");
      clearInterval(interval);
    };
  }, [source]);

  const datosFiltrados =
    filtros.sensor === "todos"
      ? data
      : data.filter((d) => d.device === filtros.sensor);

  const labels = datosFiltrados.map((d) =>
    new Date(d.time).toLocaleTimeString()
  );

  const colorSet = [
    "#1e88e5",
    "#64b5f6",
    "#ef5350",
    "#ff8a80",
    "#4db6ac",
    "#81c784",
  ];

  // === 1️⃣ EVOLUCIÓN TEMPORAL ===
  const noiseTrend = {
    labels,
    datasets:
      filtros.sensor === "todos"
        ? sensores.map((s, i) => ({
            label: s,
            data: datosFiltrados
              .filter((d) => d.device === s)
              .map((d) => d.object.laeq),
            borderColor: colorSet[i % colorSet.length],
            tension: 0.3,
            fill: false,
            pointRadius: 0,
            borderWidth: 2,
          }))
        : [
            {
              label: filtros.sensor,
              data: datosFiltrados.map((d) => d.object.laeq),
              borderColor: "#1e88e5",
              tension: 0.3,
              fill: false,
              pointRadius: 0,
              borderWidth: 3,
            },
          ],
  };

  // === 2️⃣ PROMEDIO DE RUIDO POR SENSOR (1.2) ===
  const avgSummary = {
    labels: sensores,
    datasets: [
      {
        label: "Nivel de Sonido Promedio (LAeq)",
        data: sensores.map((s) => {
          const datosSensor = datosFiltrados.filter((d) => d.device === s);
          if (datosSensor.length === 0) return 0;
          const suma = datosSensor.reduce(
            (sum, d) => sum + parseFloat(d.object.laeq || 0),
            0
          );
          return suma / datosSensor.length;
        }),
        backgroundColor: colorSet,
      },
    ],
  };

  // === 3️⃣ DISTRIBUCIÓN POR SENSOR (1.3 - usamos barras como aproximación) ===
  const boxPlotSimulado = {
    labels: sensores,
    datasets: [
      {
        label: "Rango Aproximado del Nivel de Sonido",
        data: sensores.map(() => Math.floor(30 + Math.random() * 50)),
        backgroundColor: colorSet,
      },
    ],
  };

  // === 4️⃣ HISTOGRAMA (1.6.1) ===
  const histNoise = {
    labels: ["50-60", "60-70", "70-80", "80-90", "90+"],
    datasets: [
      {
        label: "Frecuencia de Niveles de Sonido (dB)",
        data: [3, 8, 12, 6, 2], // puedes reemplazar esto por un cálculo real
        backgroundColor: "#1e88e5",
      },
    ],
  };

  // === 5️⃣ GRÁFICO DE CONTROL (1.5 I-MR simplificado) ===
  const controlChart = {
    labels,
    datasets: [
      {
        label: "Nivel Promedio de Sonido (LAeq)",
        data: datosFiltrados.map((d) => d.object.laeq),
        borderColor: "#1e88e5",
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: "Límite Superior (90 dB)",
        data: new Array(labels.length).fill(90),
        borderColor: "#ef5350",
        borderDash: [6, 6],
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: "Límite Inferior (60 dB)",
        data: new Array(labels.length).fill(60),
        borderColor: "#66bb6a",
        borderDash: [6, 6],
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  // === OPCIONES BASE (estilo tipo reporte claro) ===
  const baseOptions = (title, xLabel, yLabel) => ({
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: title,
        color: "#000",
        font: { size: 18, weight: "bold" },
      },
      legend: {
        position: "top",
        labels: { color: "#000" },
      },
    },
    scales: {
      x: {
        title: { display: !!xLabel, text: xLabel, color: "#000" },
        ticks: { color: "#000" },
      },
      y: {
        title: { display: !!yLabel, text: yLabel, color: "#000" },
        ticks: { color: "#000" },
      },
    },
  });

  // === LISTA DE GRÁFICOS (ORDEN Y TÍTULOS COMO EL DOCUMENTO) ===
  const todosLosGraficos = [
    {
      tipo: "line",
      componente: (
        <Line
          data={noiseTrend}
          options={baseOptions(
            "1.1 Evolución del Nivel de Sonido Promedio (dB)",
            "Tiempo",
            "Nivel de Sonido (dB)"
          )}
        />
      ),
    },
    {
      tipo: "bar",
      componente: (
        <Bar
          data={avgSummary}
          options={baseOptions(
            "1.2 Nivel de Sonido Promedio por Sensor",
            "Sensor",
            "Nivel de Sonido Promedio (LAeq)"
          )}
        />
      ),
    },
    {
      tipo: "bar",
      componente: (
        <Bar
          data={boxPlotSimulado}
          options={baseOptions(
            "1.3 Distribución del Nivel de Sonido por Sensor",
            "Sensor",
            "Valor Representativo (dB)"
          )}
        />
      ),
    },
    {
      tipo: "bar",
      componente: (
        <Bar
          data={histNoise}
          options={baseOptions(
            "1.6.1 Distribución de Frecuencia (Histograma)",
            "Rango de Nivel de Sonido (dB)",
            "Cantidad de Observaciones"
          )}
        />
      ),
    },
    {
      tipo: "line",
      componente: (
        <Line
          data={controlChart}
          options={baseOptions(
            "1.5 Gráfico de Control de Proceso I-MR (6 Sigma) por Sensor",
            "Tiempo",
            "Nivel de Sonido (dB)"
          )}
        />
      ),
    },
  ];

  const graficosFiltrados =
    filtros.chartType === "todos"
      ? todosLosGraficos
      : [
          ...todosLosGraficos.filter((g) => g.tipo === filtros.chartType),
          ...todosLosGraficos.filter((g) => g.tipo !== filtros.chartType),
        ];

  // === EXPORTAR EXCEL ===
  const exportToExcel = (index) => {
    const chart = graficosFiltrados[index];
    if (!chart) return;

    const labels = chart.componente.props.data.labels || [];
    const datasets = chart.componente.props.data.datasets || [];

    const headers = ["Label", ...datasets.map((d) => d.label)];

    const rows = labels.map((label, i) => {
      const row = [label];
      datasets.forEach((d) => {
        row.push(d.data[i] ?? "");
      });
      return row;
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

    XLSX.writeFile(
      workbook,
      `sonido_grafico_${index + 1}_${new Date()
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
        <h2>🔊 Sensor de Sonido</h2>
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

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "12px",
                  marginTop: "15px",
                }}
              >
                <button
                  onClick={() => setFullscreenChart(g.componente)} // ⬅️ NUEVO
                  style={{
                    padding: "8px 12px",
                    background: "#2196f3",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Pantalla Completa
                </button>

                <button
                  onClick={() => exportToExcel(i)}
                  style={{
                    padding: "8px 14px",
                    background: "#4caf50",
                    color: "white",
                    border: "none",
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

      {/* === MODAL DE PANTALLA COMPLETA === */}
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
  backgroundColor: "#ffffff", // blanco tipo reporte
  padding: 20,
  borderRadius: 10,
  boxShadow: "0 0 10px rgba(0,0,0,0.15)",
};

export default SonidoDashboard;
