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
    "#64ffda",
    "#ffa600",
    "#42a5f5",
    "#ff5252",
    "#ab47bc",
    "#66fcf1",
  ];

  // === 1️⃣ EVOLUCIÓN TEMPORAL ===
  const noiseTrend = {
    labels,
    datasets:
      filtros.sensor === "todos"
        ? sensores.map((s, i) => ({
            label: `Nivel de Ruido (${s})`,
            data: datosFiltrados
              .filter((d) => d.device === s)
              .map((d) => d.object.laeq),
            borderColor: colorSet[i % colorSet.length],
            tension: 0.4,
            fill: false,
          }))
        : [
            {
              label: `Nivel de Ruido (${filtros.sensor})`,
              data: datosFiltrados.map((d) => d.object.laeq),
              borderColor: "#ffb74d",
              tension: 0.4,
            },
          ],
  };

  // === 2️⃣ DISTRIBUCIÓN POR SENSOR (tipo Boxplot simulado) ===
  const boxPlotSimulado = {
    labels: sensores,
    datasets: [
      {
        label: "Distribución del Nivel de Sonido por Sensor",
        data: sensores.map(
          () => Math.floor(30 + Math.random() * 50) // simulación
        ),
        backgroundColor: colorSet,
      },
    ],
  };

  // === 3️⃣ PROMEDIO DE RUIDO POR SENSOR ===
  const avgSummary = {
    labels: sensores,
    datasets: [
      {
        label: "Promedio del Nivel de Ruido (dB)",
        data: sensores.map(
          (s) =>
            datosFiltrados
              .filter((d) => d.device === s)
              .reduce((sum, d) => sum + parseFloat(d.object.laeq || 0), 0) /
            (datosFiltrados.filter((d) => d.device === s).length || 1)
        ),
        backgroundColor: "#26c6da",
      },
    ],
  };

  // === 4️⃣ DISTRIBUCIÓN GENERAL ===
  const histNoise = {
    labels: ["50-60", "60-70", "70-80", "80-90", "90+"],
    datasets: [
      {
        label: "Frecuencia de Niveles de Ruido (dB)",
        data: [3, 8, 12, 6, 2],
        backgroundColor: "#64ffda",
      },
    ],
  };

  // === 5️⃣ CONTROL Y NORMALIDAD ===
  const controlChart = {
    labels,
    datasets: [
      {
        label: "Nivel Promedio de Ruido",
        data: datosFiltrados.map((d) => d.object.laeq),
        borderColor: "#42a5f5",
        tension: 0.3,
      },
      {
        label: "Límite Superior (90 dB)",
        data: new Array(labels.length).fill(90),
        borderColor: "#ff5252",
        borderDash: [6, 6],
      },
      {
        label: "Límite Inferior (60 dB)",
        data: new Array(labels.length).fill(60),
        borderColor: "#9ccc65",
        borderDash: [6, 6],
      },
    ],
  };

  const baseOptions = (title, xLabel, yLabel) => ({
    responsive: true,
    plugins: {
      title: { display: true, text: title, color: "#fff", font: { size: 16 } },
      legend: { position: "top", labels: { color: "#ccc" } },
    },
    scales: {
      x: { title: { display: true, text: xLabel, color: "#ccc" } },
      y: { title: { display: true, text: yLabel, color: "#ccc" } },
    },
  });

  const todosLosGraficos = [
    { tipo: "line", componente: <Line data={noiseTrend} options={baseOptions("Evolución del Nivel de Ruido Ambiental", "Tiempo", "Nivel (dB)")} /> },
    { tipo: "bar", componente: <Bar data={boxPlotSimulado} options={baseOptions("Distribución del Nivel de Sonido por Sensor", "Sensor", "Nivel Promedio (dB)")} /> },
    { tipo: "bar", componente: <Bar data={avgSummary} options={baseOptions("Promedio de Ruido por Sensor", "Sensor", "Promedio (dB)")} /> },
    { tipo: "bar", componente: <Bar data={histNoise} options={baseOptions("Frecuencia de Niveles de Ruido", "Rango (dB)", "Cantidad de Observaciones")} /> },
    { tipo: "line", componente: <Line data={controlChart} options={baseOptions("Gráfico de Control de Ruido (I-MR)", "Tiempo", "Nivel (dB)")} /> },
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

const card = {
  backgroundColor: "#1e1e1e",
  padding: 20,
  borderRadius: 10,
  boxShadow: "0 0 10px rgba(0,0,0,0.3)",
};
export default SonidoDashboard;
