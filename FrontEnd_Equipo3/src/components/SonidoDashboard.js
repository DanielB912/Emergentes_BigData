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
              laeq: row.LAEq || row.laeq || Math.random() * 20 + 60,
              laimax: row.LAIMax || row.laimax || Math.random() * 20 + 75,
              battery: row.Battery || row.battery || Math.random() * 30 + 70,
            },
          }));
        setData(parsed);
        setSource("CSV");

        const uniques = [...new Set(parsed.map((d) => d.device))];
        setSensores(uniques);
      },
    });
  };

  // --- DATOS SIMULADOS / SOCKET ---
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

  // === FILTROS ===
  const datosFiltrados =
    filtros.sensor === "todos"
      ? data
      : data.filter((d) => d.device === filtros.sensor);

  const labels = datosFiltrados.map((d) =>
    new Date(d.time).toLocaleTimeString()
  );

  // === DATASETS ===
  const noiseTrend = {
    labels,
    datasets:
      filtros.sensor === "todos"
        ? sensores.map((s, i) => ({
            label: `LAeq (${s})`,
            data: datosFiltrados
              .filter((d) => d.device === s)
              .map((d) => d.object.laeq),
            borderColor: ["#ffb74d", "#42a5f5", "#66fcf1", "#e57373", "#ab47bc"][
              i % 5
            ],
            fill: false,
            tension: 0.4,
          }))
        : [
            {
              label: `LAeq (${filtros.sensor})`,
              data: datosFiltrados.map((d) => d.object.laeq),
              borderColor: "#ffb74d",
              tension: 0.4,
              fill: false,
            },
          ],
  };

  const batteryTrend = {
    labels,
    datasets: [
      {
        label: "Nivel Batería (%)",
        data: datosFiltrados.map((d) => d.object.battery),
        borderColor: "#9ccc65",
        tension: 0.4,
      },
    ],
  };

  const histNoise = {
    labels: ["50-60", "60-70", "70-80", "80-90", "90+"],
    datasets: [
      {
        label: "Distribución LAeq",
        data: [3, 8, 12, 6, 2],
        backgroundColor: "#64ffda",
      },
    ],
  };

  const pieNoise = {
    labels: ["Bajo (50-60)", "Medio (60-80)", "Alto (80-100)"],
    datasets: [
      {
        label: "Ruido",
        data: [25, 50, 25],
        backgroundColor: ["#42a5f5", "#ffa600", "#ff5252"],
      },
    ],
  };

  const scatterNoise = {
    datasets: [
      {
        label: "LAeq vs LAiMax",
        data: datosFiltrados.map((d) => ({
          x: d.object.laeq,
          y: d.object.laimax,
        })),
        backgroundColor: "#ffa600",
      },
    ],
  };

  const avgSummary = {
    labels: sensores,
    datasets: [
      {
        label: "Promedio LAeq",
        data: sensores.map(
          (s) =>
            datosFiltrados
              .filter((d) => d.device === s)
              .reduce((sum, d) => sum + parseFloat(d.object.laeq || 0), 0) /
            (datosFiltrados.filter((d) => d.device === s).length || 1)
        ),
        backgroundColor: "#45d5c1",
      },
    ],
  };

  const corrScatter = {
    datasets: [
      {
        label: "LAeq vs Battery",
        data: datosFiltrados.map((d) => ({
          x: d.object.laeq,
          y: d.object.battery,
        })),
        backgroundColor: "#64ffda",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: { display: true, text: "Análisis Sensor Sonido" },
      zoom: {
        zoom: { wheel: { enabled: true }, mode: "x" },
        pan: { enabled: true, mode: "x" },
      },
      legend: { position: "top" },
    },
  };

  // === ORDEN DINÁMICO DE GRÁFICOS ===
  const todosLosGraficos = [
    { tipo: "line", componente: <Line ref={chartRef} data={noiseTrend} options={options} /> },
    { tipo: "line", componente: <Line data={batteryTrend} options={options} /> },
    { tipo: "bar", componente: <Bar data={histNoise} options={options} /> },
    { tipo: "pie", componente: <Pie data={pieNoise} options={options} /> },
    { tipo: "scatter", componente: <Scatter data={scatterNoise} options={options} /> },
    { tipo: "bar", componente: <Bar data={avgSummary} options={options} /> },
    { tipo: "scatter", componente: <Scatter data={corrScatter} options={options} /> },
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const card = { backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 };
export default SonidoDashboard;
