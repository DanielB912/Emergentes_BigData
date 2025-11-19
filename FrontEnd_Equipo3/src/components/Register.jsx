import React, { useState } from "react";
import "../styles.css";

const FIREBASE_URL = "https://mydatabase-e28b2-default-rtdb.firebaseio.com";

function Register({ onRegister, irLogin, user }) {
  // 🛡️ Control de acceso SOLO aquí
  if (!user || user.role !== "administrador") {
    return (
      <div className="unauthorized">
        <h3>🚫 Acceso denegado</h3>
        <p>Solo el administrador puede registrar usuarios.</p>
        {irLogin && (
          <button onClick={irLogin}>Volver</button>
        )}
      </div>
    );
  }

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operador");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (username.length < 3) {
      return setError("Usuario demasiado corto.");
    }
    if (password.length < 6) {
      return setError("La contraseña debe tener al menos 6 caracteres.");
    }

    const nuevoUsuario = { username, password, role };

    try {
      const res = await fetch(`${FIREBASE_URL}/usuarios.json`, {
        method: "POST",
        body: JSON.stringify(nuevoUsuario),
      });

      if (res.ok) {
        alert("Usuario registrado correctamente 🎉");
        onRegister && onRegister(nuevoUsuario);
        setUsername("");
        setPassword("");
        setRole("operador");
        setError("");
      } else {
        setError("Error guardando usuario en Firebase.");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con Firebase.");
    }
  };

  return (
    <div className="login-container">
      <h2>🧑‍💼 Registrar Usuario</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="administrador">Administrador</option>
          <option value="ejecutivo">Ejecutivo</option>
          <option value="operador">Operador</option>
        </select>

        <button type="submit">Registrar</button>
      </form>

      {error && <p className="error">{error}</p>}

      {irLogin && (
        <button className="link-btn" onClick={irLogin}>
          ← Volver al dashboard
        </button>
      )}
    </div>
  );
}

export default Register;
