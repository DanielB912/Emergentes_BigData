import React, { useEffect, useState } from "react";
import { Line, Bar, Scatter } from "react-chartjs-2";
import Papa from "papaparse";
import { socket } from "../socket";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

function SonidoDashboard() {
  const [data, setData] = useState([]);
  const [source, setSource] = useState("Simulado");

  // --- LECTURA CSV ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        const parsedData = result.data.map((row) => ({
          time: new Date().toISOString(),
          object: {
            laeq: row.LAEq || row.laeq || Math.random() * 20 + 60,
            laiMax: row.LAIMax || row.laiMax || Math.random() * 20 + 70,
            battery: row.Battery || row.battery || Math.random() * 30 + 70,
          },
        }));
        setData(parsedData);
        setSource("CSV");
      },
    });
  };

  useEffect(() => {
    let interval;
    try {
      // 🔌 Datos reales del backend
      socket.on("nuevoDatoSonido", (dato) => {
        setData((prev) => [...prev.slice(-99), dato]);
        setSource("Tiempo Real");
      });

      // 🧪 Datos simulados
      interval = setInterval(() => {
        if (source === "Simulado") {
          const simulacion = {
            time: new Date().toISOString(),
            object: {
              laeq: (60 + Math.random() * 20).toFixed(2),
              laiMax: (75 + Math.random() * 20).toFixed(2),
              battery: (70 + Math.random() * 30).toFixed(2),
            },
          };
          setData((prev) => [...prev.slice(-99), simulacion]);
        }
      }, 1000);
    } catch (err) {
      console.warn("⚠️ Sin conexión al backend, usando datos simulados...");
    }

    return () => {
      socket.off("nuevoDatoSonido");
      clearInterval(interval);
    };
  }, [source]);

  const labels = data.map((d) => new Date(d.time).toLocaleTimeString());

  // 1️⃣ Niveles de ruido
  const noiseTrend = {
    labels,
    datasets: [
      { label: "LAeq (dB)", data: data.map((d) => d.object.laeq), borderColor: "orange", fill: false },
      { label: "LAiMax (dB)", data: data.map((d) => d.object.laiMax), borderColor: "red", fill: false },
    ],
  };

  // 2️⃣ Promedio por sensor
  const avgNoise = {
    labels: ["Sensor 1", "Sensor 2", "Sensor 3", "Sensor 4"],
    datasets: [
      { label: "Promedio LAeq (dB)", data: [72, 70, 68, 75], backgroundColor: "#26c6da" },
    ],
  };

  // 3️⃣ Nivel de batería
  const batteryTrend = {
    labels,
    datasets: [
      { label: "Nivel de batería (%)", data: data.map((d) => d.object.battery), borderColor: "gray", fill: false },
    ],
  };

  // 4️⃣ Histograma de LAeq
  const laeqHist = {
    labels: Array.from({ length: 10 }, (_, i) => `Rango ${i + 1}`),
    datasets: [
      { label: "Distribución LAeq (dB)", data: data.slice(0, 10).map((d) => d.object.laeq), backgroundColor: "#42a5f5" },
    ],
  };

  // 5️⃣ Dispersión: LAeq vs LAiMax
  const scatterNoise = {
    datasets: [
      {
        label: "LAeq vs LAiMax",
        data: data.map((d) => ({ x: d.object.laeq, y: d.object.laiMax })),
        backgroundColor: "#ffb74d",
      },
    ],
  };

  // 6️⃣ Correlaciones (simuladas)
  const corrData = {
    labels: ["LAeq", "LAiMax", "Battery"],
    datasets: [
      { label: "Correlaciones simuladas", data: [0.82, 0.69, -0.15], backgroundColor: ["#ff7043", "#42a5f5", "#9ccc65"] },
    ],
  };

  return (
    <div className="dashboard">
      <h2>🔊 Sensor de Sonido</h2>
      <p style={{ color: "gray" }}>🔁 Fuente actual: {source}</p>
      <input type="file" accept=".csv" onChange={handleFileUpload} style={{ margin: "10px 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginTop: "20px" }}>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Line data={noiseTrend} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Bar data={avgNoise} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Line data={batteryTrend} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Bar data={laeqHist} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Scatter data={scatterNoise} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Bar data={corrData} /></div>
      </div>
    </div>
  );
}

export default SonidoDashboard;
