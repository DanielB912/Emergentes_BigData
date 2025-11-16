import React from "react";
import "../styles.css";

const Navbar = ({ setVista, vista }) => (
  <header className="navbar">
    <h1 className="logo">📊 Dashboard GAMC</h1>
    <nav className="nav-buttons">
      <button className={vista === "aire" ? "active" : ""} onClick={() => setVista("aire")}>🌫️ Aire</button>
      <button className={vista === "sonido" ? "active" : ""} onClick={() => setVista("sonido")}>🔊 Sonido</button>
      <button className={vista === "soterrado" ? "active" : ""} onClick={() => setVista("soterrado")}>🌎 Soterrado</button>
    </nav>
  </header>
);

export default Navbar;
