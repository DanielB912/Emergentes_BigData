import React from "react";
import "../styles.css";

const Navbar = ({ setVista, vista, user, setUser }) => {
  const handleLogout = () => {
    setUser(null);
    setVista("aire"); // 🔥 vuelve a la vista principal siempre
  };

  return (
    <header className="navbar">
      <h1 className="logo">📊 Dashboard GAMC</h1>

      <nav className="nav-buttons">
        <button
          className={vista === "aire" ? "active" : ""}
          onClick={() => setVista("aire")}
        >
          🌫️ Aire
        </button>

        <button
          className={vista === "sonido" ? "active" : ""}
          onClick={() => setVista("sonido")}
        >
          🔊 Sonido
        </button>

        <button
          className={vista === "soterrado" ? "active" : ""}
          onClick={() => setVista("soterrado")}
        >
          🌎 Soterrado
        </button>

        {(user.role === "ejecutivo" || user.role === "administrador") && (
          <button
            className={vista === "proyeccion" ? "active" : ""}
            onClick={() => setVista("proyeccion")}
          >
            📈 Proyección ML
          </button>
        )}

        {/* 🔥 Solo el administrador ve esta opción */}
        {user.role === "administrador" && (
          <button
            className={vista === "registro" ? "active" : ""}
            onClick={() => setVista("registro")}
          >
            🧑‍💼 Registrar Usuario
          </button>
        )}
      </nav>

      <div className="user-info">
        <span>{user.username} ({user.role})</span>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </header>
  );
};

export default Navbar;
