import React, { useEffect, useState, useRef } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import Papa from "papaparse";
import { socket } from "../socket";
import SidebarFiltrosAvanzado from "./SidebarFiltrosAvanzado";
import FullScreenChart from "./FullScreenChart";
import * as XLSX from "xlsx";
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
  const [fullscreenChart, setFullscreenChart] = useState(null);

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
            .filter((row) => row.device_name || row.sensor_id)
            .map((row) => ({
              device:
                row.device_name || `sensor_sonido_${row.sensor_id || 1}`,
              time: row.time || row.fecha_hora || new Date().toISOString(),
              object: {
                laeq: parseFloat(row.laeq) || 0,
                lai: parseFloat(row.lai) || 0,
                laimax: parseFloat(row.laimax) || 0,
                battery: parseFloat(row.battery) || 0,
                status: row.status || "OK",
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
          device: `sensor_sonido_${row.sensor_id || 1}`,
          time: row.fecha_hora || new Date().toISOString(),
          object: {
            laeq: parseFloat(row.laeq) || 0,
            lai: parseFloat(row.lai) || 0,
            laimax: parseFloat(row.laimax) || 0,
            battery: parseFloat(row.battery) || 0,
            status: row.status || "OK",
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

  // === DATOS EN TIEMPO REAL ===
  useEffect(() => {
    socket.on("sonido_update", (datoNuevo) => {
      const dato = {
        device: datoNuevo.device_name || datoNuevo.device || "sensor_sonido",
        time: datoNuevo.time || new Date().toISOString(),
        object: {
          laeq:
            datoNuevo.object?.laeq ??
            datoNuevo.laeq ??
            Math.random() * 10 + 50,
          lai:
            datoNuevo.object?.lai ??
            datoNuevo.lai ??
            Math.random() * 10 + 40,
          laimax:
            datoNuevo.object?.laimax ??
            datoNuevo.laimax ??
            Math.random() * 10 + 70,
          battery:
            datoNuevo.object?.battery ??
            datoNuevo.battery ??
            Math.random() * 20 + 80,
          status: datoNuevo.status || "OK",
        },
      };
      setData((prev) => [...prev.slice(-99), dato]);
      setSensores((prev) =>
        [...new Set([...prev, dato.device])].filter(Boolean)
      );
      setSource("Tiempo Real");
    });

    return () => socket.off("sonido_update");
  }, []);

  // === DATOS FILTRADOS ===
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
              .map((d) => d.object.laeq ?? 0),
            borderColor: colorSet[i % colorSet.length],
            tension: 0.4,
            fill: false,
          }))
        : [
            {
              label: `Nivel de Ruido (${filtros.sensor})`,
              data: datosFiltrados.map((d) => d.object.laeq ?? 0),
              borderColor: "#ffb74d",
              tension: 0.4,
            },
          ],
  };

  // === 2️⃣ PROMEDIO POR SENSOR ===
  const avgSummary = {
    labels: sensores.length ? sensores : ["Sin datos"],
    datasets: [
      {
        label: "Promedio del Nivel de Ruido (dB)",
        data: sensores.map((s) => {
          const valores = data
            .filter((d) => d.device === s)
            .map((d) => parseFloat(d.object.laeq ?? 0));
          return valores.length > 0
            ? valores.reduce((a, b) => a + b, 0) / valores.length
            : 0;
        }),
        backgroundColor: "#26c6da",
      },
    ],
  };

  // === 3️⃣ DISTRIBUCIÓN GENERAL ===
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

  // === 4️⃣ CONTROL 6σ ===
  const controlChart = {
    labels,
    datasets: [
      {
        label: "Nivel Promedio de Ruido",
        data: datosFiltrados.map((d) => d.object.laeq ?? 0),
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
        label: "Límite Inferior (30 dB)",
        data: new Array(labels.length).fill(30),
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
    {
      tipo: "line",
      componente: (
        <Line
          data={noiseTrend}
          options={baseOptions(
            "Evolución del Nivel de Ruido Ambiental",
            "Tiempo",
            "Nivel (dB)"
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
            "Promedio de Ruido por Sensor",
            "Sensor",
            "Promedio (dB)"
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
            "Frecuencia de Niveles de Ruido",
            "Rango (dB)",
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
            "Gráfico de Control de Ruido (6σ)",
            "Tiempo",
            "Nivel (dB)"
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

  // === EXPORTAR A EXCEL ===
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
        <input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} />

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
                  onClick={() => setFullscreenChart(g.componente)}
                  style={btnBlue}
                >
                  Pantalla Completa
                </button>
                <button onClick={() => exportToExcel(i)} style={btnGreen}>
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

const card = {
  backgroundColor: "#1e1e1e",
  padding: 20,
  borderRadius: 10,
  boxShadow: "0 0 10px rgba(0,0,0,0.3)",
};
const btnBlue = {
  padding: "8px 12px",
  background: "#2196f3",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
const btnGreen = {
  padding: "8px 14px",
  background: "#4caf50",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

export default SonidoDashboard;
