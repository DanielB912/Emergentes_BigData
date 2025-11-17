import React, { useState } from "react";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import ProyeccionML from "./components/ProyeccionML";
import AireDashboard from "./components/AireDashboard";
import SonidoDashboard from "./components/SonidoDashboard";
import SoterradoDashboard from "./components/SoterradoDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles.css";

function App() {
  const [user, setUser] = useState(null);
  const [vista, setVista] = useState("aire");

  // Si no hay usuario autenticado, mostrar login
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // Determina qué vista mostrar según la opción seleccionada
  const renderVista = () => {
    switch (vista) {
      case "aire":
        return <AireDashboard role={user.role} />;
      case "sonido":
        return <SonidoDashboard role={user.role} />;
      case "soterrado":
        return <SoterradoDashboard role={user.role} />;
      case "proyeccion":
        return <ProyeccionML />;
      default:
        return <AireDashboard role={user.role} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar setVista={setVista} vista={vista} user={user} setUser={setUser} />

      <div className="dashboard-container">
        {/* ❌ Eliminamos el sidebar viejo */}
        {/* {user.role === "ejecutivo" && <SidebarFiltros />} */}

        <ProtectedRoute user={user}>
          <main className="content">{renderVista()}</main>
        </ProtectedRoute>
      </div>
    </div>
  );
}

export default App;
