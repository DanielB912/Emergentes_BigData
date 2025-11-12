import React, { useState } from "react";
import Navbar from "./components/Navbar";
import AireDashboard from "./components/AireDashboard";
import SonidoDashboard from "./components/SonidoDashboard";
import SoterradoDashboard from "./components/SoterradoDashboard";
import "./styles.css";

function App() {
  const [vista, setVista] = useState("aire");

  const renderVista = () => {
    switch (vista) {
      case "aire": return <AireDashboard />;
      case "sonido": return <SonidoDashboard />;
      case "soterrado": return <SoterradoDashboard />;
      default: return <AireDashboard />;
    }
  };

  return (
    <div className="app-container">
      <Navbar setVista={setVista} vista={vista} />
      <main className="content">{renderVista()}</main>
    </div>
  );
}

export default App;
