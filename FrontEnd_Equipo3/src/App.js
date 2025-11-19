import React, { useState } from "react";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import ProyeccionML from "./components/ProyeccionML";
import AireDashboard from "./components/AireDashboard";
import SonidoDashboard from "./components/SonidoDashboard";
import SoterradoDashboard from "./components/SoterradoDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./components/Register";
import "./styles.css";

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

      case "proyeccion":
        return <ProyeccionML />;

      case "registro":
        // 👉 AQUÍ ya NO comprobamos el rol, eso lo hace Register
        return (
          <Register
            user={user}
            onRegister={() => setVista("aire")} // después de crear usuario vuelve a Aire
            irLogin={() => setVista("aire")}   // también se usa para el botón "Volver"
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
