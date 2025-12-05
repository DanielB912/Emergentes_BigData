import React, { useState } from "react";
import "../styles.css";

// Importamos las 3 vistas
import ProyeccionAire from "../data/proyeccionAire.js";
import ProyeccionSonido from "../data/proyeccionSonido.js";
import ProyeccionSoterrado from "../data/proyecccionSoterrado.js";

function ProyeccionML() {
  const [vista, setVista] = useState("aire");

  const renderVista = () => {
    switch (vista) {
      case "aire":
        return <ProyeccionAire />;

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
