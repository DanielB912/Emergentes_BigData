import React, { useState } from "react";
import "../styles.css";

// Importación de vistas de predicción
import GraficaPrediccion7Dias from "../data/GraficaPrediccion7Dias.js";

// JSON generados por Python
import predAire from "../data/resultados_co2.json";
import predSonido from "../data/resultados_sonido.json";
import predSoterrado from "../data/resultados_soterrados.json";

// Componentes de gráficos
import ProyeccionAire from "../data/proyeccionAire.js";
import ProyeccionSonido from "../data/proyeccionSonido.js";
import ProyeccionSoterrado from "../data/proyecccionSoterrado.js";

function ProyeccionML() {
  const [vista, setVista] = useState("aire");

  const renderVista = () => {
    switch (vista) {
      case "aire":
        return <ProyeccionAire data={predAire} />;
      case "sonido":
        return <ProyeccionSonido data={predSonido} />;
      case "soterrado":
        return <ProyeccionSoterrado data={predSoterrado} />;
      case "7dias":
        return <GraficaPrediccion7Dias />;
      default:
        return <p>No hay vista seleccionada.</p>;
    }
  };

  return (
    <div className="proyeccion-container">
      <h1 className="titulo-proyeccion">📈 Predicciones con Machine Learning</h1>

      {/* Botones de selección */}
      <div className="proyeccion-buttons">
        <button
          className={vista === "aire" ? "btn-activo" : "btn"}
          onClick={() => setVista("aire")}
        >
          🌬️ Aire
        </button>

        <button
          className={vista === "sonido" ? "btn-activo" : "btn"}
          onClick={() => setVista("sonido")}
        >
          🔊 Sonido
        </button>

        <button
          className={vista === "soterrado" ? "btn-activo" : "btn"}
          onClick={() => setVista("soterrado")}
        >
          🏗️ Soterrado
        </button>

        <button
          className={vista === "7dias" ? "btn-activo" : "btn"}
          onClick={() => setVista("7dias")}
        >
          📅 7 días
        </button>
      </div>

      {/* Contenido dinámico */}
      <div className="proyeccion-contenido">{renderVista()}</div>
    </div>
  );
}

export default ProyeccionML;
