import React, { useState } from "react";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import AireProphet from "./components/AireProphet";
import SonidoProphet from "./components/SonidoProphet";
import SoterradoProphet from "./components/SoterradoProphet";
import AireDashboard from "./components/AireDashboard";
import SonidoDashboard from "./components/SonidoDashboard";
import SoterradoDashboard from "./components/SoterradoDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./components/Register";
import "./styles.css";
import ProyeccionML from "./components/ProyeccionML";


function App() {
  const [user, setUser] = useState(null);
  const [vista, setVista] = useState("aire");

  // 🔐 Si no hay sesión → mostrar login
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // 🔥 Render dinámico según la vista actual
  const renderVista = () => {
    switch (vista) {
      case "aire":
        return <AireDashboard role={user.role} />;

      case "sonido":
        return <SonidoDashboard role={user.role} />;

      case "soterrado":
        return <SoterradoDashboard role={user.role} />;

      // ✅ NUEVA SECCIÓN PROPHET
      case "prophet-aire":
        return <AireProphet />;

      case "prophet-sonido":
        return <SonidoProphet />;

      case "prophet-soterrado":
        return <SoterradoProphet />;

      case "ml":
        return <ProyeccionML />;


      case "registro":
        return (
          <Register
            user={user}
            onRegister={() => setVista("aire")}
            irLogin={() => setVista("aire")}
          />
        );

      default:
        return <AireDashboard role={user.role} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar
        setVista={setVista}
        vista={vista}
        user={user}
        setUser={setUser}
      />

      <div className="dashboard-container">
        <ProtectedRoute user={user}>
          <main className="content">{renderVista()}</main>
        </ProtectedRoute>
      </div>
    </div>
  );
}

export default App;
