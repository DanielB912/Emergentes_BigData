import React, { useEffect, useState } from "react";
import { Line, Scatter, Bar } from "react-chartjs-2";
import Papa from "papaparse";
import { socket } from "../socket";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

function SoterradoDashboard() {
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
            vibration: row.Vibration || row.vibration || Math.random() * 100,
            methane: row.Methane || row.methane || Math.random() * 10,
            moisture: row.Moisture || row.moisture || Math.random() * 60 + 30,
            temperature: row.Temperature || row.temperature || Math.random() * 10 + 15,
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
      socket.on("nuevoDatoSoterrado", (dato) => {
        setData((prev) => [...prev.slice(-99), dato]);
        setSource("Tiempo Real");
      });

      interval = setInterval(() => {
        if (source === "Simulado") {
          const simulacion = {
            time: new Date().toISOString(),
            object: {
              vibration: (Math.random() * 100).toFixed(2),
              methane: (Math.random() * 10).toFixed(2),
              moisture: (30 + Math.random() * 60).toFixed(2),
              temperature: (12 + Math.random() * 10).toFixed(2),
            },
          };
          setData((prev) => [...prev.slice(-99), simulacion]);
        }
      }, 1000);
    } catch (err) {
      console.warn("⚠️ Sin conexión al backend, usando datos simulados...");
    }

    return () => {
      socket.off("nuevoDatoSoterrado");
      clearInterval(interval);
    };
  }, [source]);

  const labels = data.map((d) => new Date(d.time).toLocaleTimeString());

  // 1️⃣ Vibración y Metano
  const vibMeth = {
    labels,
    datasets: [
      { label: "Vibración (Hz)", data: data.map((d) => d.object.vibration), borderColor: "purple", fill: false },
      { label: "Metano (ppm)", data: data.map((d) => d.object.methane), borderColor: "orange", fill: false },
    ],
  };

  // 2️⃣ Humedad vs Temperatura
  const scatterData = {
    datasets: [
      {
        label: "Humedad vs Temperatura",
        data: data.map((d) => ({ x: d.object.moisture, y: d.object.temperature })),
        backgroundColor: "#42a5f5",
      },
    ],
  };

  // 3️⃣ Promedio de temperatura por sensor
  const avgTemp = {
    labels: ["Sensor Soterrado 1", "Sensor Soterrado 2", "Sensor Soterrado 3"],
    datasets: [
      { label: "Temperatura promedio (°C)", data: [17.5, 18.2, 19.1], backgroundColor: "#e57373" },
    ],
  };

  // 4️⃣ Correlaciones
  const corrData = {
    labels: ["Vibración", "Metano", "Humedad", "Temp."],
    datasets: [
      { label: "Correlaciones simuladas", data: [0.72, 0.55, -0.18, 0.83], backgroundColor: ["#ba68c8", "#ffb74d", "#64b5f6", "#81c784"] },
    ],
  };

  // 5️⃣ Histograma de metano
  const methaneHist = {
    labels: Array.from({ length: 10 }, (_, i) => `Rango ${i + 1}`),
    datasets: [
      { label: "Metano (ppm)", data: data.slice(0, 10).map((d) => d.object.methane), backgroundColor: "#f57c00" },
    ],
  };

  // 6️⃣ Dispersión: Vibración vs Humedad
  const scatterExtra = {
    datasets: [
      {
        label: "Vibración vs Humedad",
        data: data.map((d) => ({ x: d.object.vibration, y: d.object.moisture })),
        backgroundColor: "#81c784",
      },
    ],
  };

  return (
    <div className="dashboard">
      <h2>🌎 Sensor Soterrado</h2>
      <p style={{ color: "gray" }}>🔁 Fuente actual: {source}</p>
      <input type="file" accept=".csv" onChange={handleFileUpload} style={{ margin: "10px 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginTop: "20px" }}>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Line data={vibMeth} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Scatter data={scatterData} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Bar data={avgTemp} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Bar data={corrData} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Bar data={methaneHist} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Scatter data={scatterExtra} /></div>
      </div>
    </div>
  );
}

export default SoterradoDashboard;
