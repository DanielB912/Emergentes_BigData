import React, { useState } from "react";
import "../styles.css";

const usuarios = [
  { username: "Operador1", password: "Operador123$", role: "operador" },
  { username: "Ejecutivo1", password: "Ejecutivo123$", role: "ejecutivo" },
];

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = usuarios.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      onLogin(user);
    } else {
      setError("Credenciales inválidas. Intenta nuevamente.");
    }
  };

  return (
    <div className="login-container">
      <h2>🔐 Iniciar sesión</h2>
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
        <button type="submit">Entrar</button>
      </form>
      {error && <p className="error">{error}</p>}
      <small>👷 Operador: Operador1 / Operador123$</small><br />
      <small>💼 Ejecutivo: Ejecutivo1 / Ejecutivo123$</small>
    </div>
  );
}

export default Login;
