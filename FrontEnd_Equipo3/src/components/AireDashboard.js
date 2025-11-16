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

function AireDashboard({ role }) {
  const [data, setData] = useState([]);
  const [filtros, setFiltros] = useState({
    desde: new Date(),
    hasta: new Date(),
    variable: "temperature",
    sensor: "todos",
    chartType: "todos",
    rangoCO2: "todos", // nuevo filtro para CO₂
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

  // --- DATOS SIMULADOS / SOCKET ---
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
      console.warn("⚠️ Sin conexión al backend, usando simulación...");
    }
    return () => {
      socket.off("nuevoDatoAire");
      clearInterval(interval);
    };
  }, [source]);

  // === FILTROS ===
  const datosFiltrados = data.filter((d) => {
    if (filtros.sensor !== "todos" && d.device !== filtros.sensor) return false;

    // Nuevo filtro para rango de CO₂
    if (filtros.rangoCO2 !== "todos") {
      const c = parseFloat(d.object.co2);
      if (filtros.rangoCO2 === "bajo" && c >= 500) return false;
      if (filtros.rangoCO2 === "medio" && (c < 500 || c > 600)) return false;
      if (filtros.rangoCO2 === "alto" && c <= 600) return false;
    }

    return true;
  });

  const labels = datosFiltrados.map((d) =>
    new Date(d.time).toLocaleTimeString()
  );

  // === DATASETS ===
  const tempTrend = {
    labels,
    datasets:
      filtros.sensor === "todos"
        ? sensores.map((s, i) => ({
            label: `Temp (${s})`,
            data: datosFiltrados
              .filter((d) => d.device === s)
              .map((d) => d.object.temperature),
            borderColor: ["#ffb74d", "#42a5f5", "#ab47bc", "#66fcf1"][i % 4],
            tension: 0.4,
          }))
        : [
            {
              label: `Temperatura (${filtros.sensor})`,
              data: datosFiltrados.map((d) => d.object.temperature),
              borderColor: "#ffb74d",
              tension: 0.4,
            },
          ],
  };

  const co2Pressure = {
    labels,
    datasets: [
      {
        label: "CO₂ (ppm)",
        data: datosFiltrados.map((d) => d.object.co2),
        borderColor: "#66fcf1",
        tension: 0.4,
      },
      {
        label: "Presión (hPa)",
        data: datosFiltrados.map((d) => d.object.pressure),
        borderColor: "#9ccc65",
        tension: 0.4,
      },
    ],
  };

  const tempHist = {
    labels: ["15-20", "20-25", "25-30", "30-35"],
    datasets: [
      {
        label: "Frecuencia Temp",
        data: [3, 8, 10, 6],
        backgroundColor: "#ffa600",
      },
    ],
  };

  const pieCO2 = {
    labels: ["Bajo (400-500 ppm)", "Medio (500-600 ppm)", "Alto (600-700 ppm)"],
    datasets: [
      {
        data: [
          datosFiltrados.filter((d) => d.object.co2 < 500).length,
          datosFiltrados.filter(
            (d) => d.object.co2 >= 500 && d.object.co2 <= 600
          ).length,
          datosFiltrados.filter((d) => d.object.co2 > 600).length,
        ],
        backgroundColor: ["#66fcf1", "#ffa600", "#ff5252"],
      },
    ],
  };

  const scatterTH = {
    datasets: [
      {
        label: "Temp vs Humedad",
        data: datosFiltrados.map((d) => ({
          x: d.object.temperature,
          y: d.object.humidity,
        })),
        backgroundColor: "#45d5c1",
      },
    ],
  };

  const avgSummary = {
    labels: sensores,
    datasets: [
      {
        label: "Promedio Temp",
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

  const options = {
    responsive: true,
    plugins: {
      title: { display: true, text: "Análisis Sensor Aire" },
      zoom: {
        zoom: { wheel: { enabled: true }, mode: "x" },
        pan: { enabled: true, mode: "x" },
      },
      legend: { position: "top" },
    },
  };

  // === ORDEN DINÁMICO DE GRÁFICOS ===
  const todosLosGraficos = [
    { tipo: "line", componente: <Line ref={chartRef} data={tempTrend} options={options} /> },
    { tipo: "line", componente: <Line data={co2Pressure} options={options} /> },
    { tipo: "bar", componente: <Bar data={tempHist} options={options} /> },
    { tipo: "pie", componente: <Pie data={pieCO2} options={options} /> },
    { tipo: "scatter", componente: <Scatter data={scatterTH} options={options} /> },
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
        <h2>🌫️ Sensor de Aire</h2>
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
export default AireDashboard;
