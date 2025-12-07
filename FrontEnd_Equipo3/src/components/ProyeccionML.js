import React, { useState } from "react";
import "../styles.css";

// Importamos las 3 vistas
import ProyeccionAire from "../data/proyeccionAire.js";
import ProyeccionSonido from "../data/proyeccionSonido.js";
import ProyeccionSoterrado from "../data/proyecccionSoterrado.js";
import GraficaPrediccion7Dias from "../data/GraficaPrediccion7Dias.js";

//ESTE SCRIPT SOLO ERA PARA VER QUE GRAFICA SALIA
//LAS GRAFICAS SE GENERAN EN PYTHON AL EJECUTARSE EL SCRIPT
//LANZA UN OUTPUT COMO RESULTADOS QUE SE PUEDEN USAR DESDE EL FRONTEND
//LOS JSON SALEN CON LOS NOMBRES: resultados_co2.json, resultados_sensores_soterrados.json, resultados_sonido.json

function ProyeccionML() {
  const [vista, setVista] = useState("aire");

  const renderVista = () => {
    switch (vista) {
      case "aire":
        return <GraficaPrediccion7Dias />;

      case "sonido":
        return <ProyeccionSonido />;

      case "soterrado":
        return <ProyeccionSoterrado />;

      default:
        return <ProyeccionAire />;
    }
  };

  return (
    <div className="dashboard">
      <h2>📈 Proyección con Machine Learning</h2>
      <p>Selecciona el tipo de proyección:</p>

      {/* 🔘 Selector de 3 vistas */}
      <div className="proyeccion-selector">
        <button
          className={vista === "aire" ? "activo" : ""}
          onClick={() => setVista("aire")}
        >
          🌬️ Aire
        </button>

        <button
          className={vista === "sonido" ? "activo" : ""}
          onClick={() => setVista("sonido")}
        >
          🔊 Sonido
        </button>

        <button
          className={vista === "soterrado" ? "activo" : ""}
          onClick={() => setVista("soterrado")}
        >
          🏗️ Soterrado
        </button>
      </div>

      {/* Contenido dinámico */}
      <div className="proyeccion-contenido">
        {renderVista()}
      </div>
    </div>
  );
}

export default ProyeccionML;
