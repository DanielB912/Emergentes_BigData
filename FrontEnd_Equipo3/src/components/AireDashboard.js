import React, { useEffect, useState } from "react";
import { Line, Bar, Scatter } from "react-chartjs-2";
import Papa from "papaparse";
import { socket } from "../socket";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

function AireDashboard() {
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
            temperature: row.Temperature || row.temperature || Math.random() * 10 + 20,
            humidity: row.Humidity || row.humidity || Math.random() * 30 + 40,
            co2: row.CO2 || row.co2 || Math.random() * 1000,
            pressure: row.Pressure || row.pressure || Math.random() * 10 + 1010,
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
      socket.on("nuevoDatoAire", (dato) => {
        setData((prev) => [...prev.slice(-99), dato]);
        setSource("Tiempo Real");
      });

      interval = setInterval(() => {
        if (source === "Simulado") {
          const simulacion = {
            time: new Date().toISOString(),
            object: {
              temperature: (20 + Math.random() * 8).toFixed(2),
              humidity: (40 + Math.random() * 30).toFixed(2),
              co2: (400 + Math.random() * 500).toFixed(0),
              pressure: (1010 + Math.random() * 15).toFixed(2),
            },
          };
          setData((prev) => [...prev.slice(-99), simulacion]);
        }
      }, 1000);
    } catch (err) {
      console.warn("⚠️ Sin conexión al backend, usando datos simulados...");
    }

    return () => {
      socket.off("nuevoDatoAire");
      clearInterval(interval);
    };
  }, [source]);

  const labels = data.map((d) => new Date(d.time).toLocaleTimeString());

  const tempHum = {
    labels,
    datasets: [
      { label: "Temperatura (°C)", data: data.map((d) => d.object.temperature), borderColor: "tomato", fill: false },
      { label: "Humedad (%)", data: data.map((d) => d.object.humidity), borderColor: "skyblue", fill: false },
    ],
  };

  const co2Data = {
    labels,
    datasets: [
      { label: "CO₂ (ppm)", data: data.map((d) => d.object.co2), borderColor: "limegreen", fill: false },
    ],
  };

  const histData = {
    labels: Array.from({ length: 10 }, (_, i) => `Lote ${i + 1}`),
    datasets: [{ label: "Presión (hPa)", data: data.slice(0, 10).map((d) => d.object.pressure), backgroundColor: "slateblue" }],
  };

  const scatterData = {
    datasets: [
      {
        label: "Humedad vs Temperatura",
        data: data.map((d) => ({ x: d.object.humidity, y: d.object.temperature })),
        backgroundColor: "#ffb74d",
      },
    ],
  };

  const corrData = {
    labels: ["Temp", "Humedad", "CO₂", "Presión"],
    datasets: [
      { label: "Correlaciones simuladas", data: [0.8, -0.2, 0.65, 0.1], backgroundColor: ["#ff6666", "#66ccff", "#33cc33", "#cccc33"] },
    ],
  };

  const avgData = {
    labels: ["Sensor 1", "Sensor 2", "Sensor 3"],
    datasets: [
      { label: "Temperatura promedio (°C)", data: [21, 23, 22], backgroundColor: "#ff7043" },
    ],
  };

  return (
    <div className="dashboard">
      <h2>🌫️ Sensor de Calidad del Aire</h2>
      <p style={{ color: "gray" }}>🔁 Fuente actual: {source}</p>
      <input type="file" accept=".csv" onChange={handleFileUpload} style={{ margin: "10px 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginTop: "20px" }}>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Line data={tempHum} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Line data={co2Data} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Bar data={histData} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Scatter data={scatterData} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Bar data={corrData} /></div>
        <div style={{ backgroundColor: "#1e1e1e", padding: 20, borderRadius: 10 }}><Bar data={avgData} /></div>
      </div>
    </div>
  );
}

export default AireDashboard;
