import React, { useState, useEffect } from "react";
import "../styles.css";

const FIREBASE_URL = "https://mydatabase-e28b2-default-rtdb.firebaseio.com";

const usuariosBase = [
  { username: "Admin1", password: "Admin123$", role: "administrador" },
  { username: "Ejecutivo1", password: "Ejecutivo123$", role: "ejecutivo" },
  { username: "Operador1", password: "Operador123$", role: "operador" },
];

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usuariosFirebase, setUsuariosFirebase] = useState([]);
  const [error, setError] = useState("");

  // Cargar usuarios desde Firebase
  useEffect(() => {
    fetch(`${FIREBASE_URL}/usuarios.json`)
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;
        setUsuariosFirebase(Object.values(data));
      })
      .catch((err) => console.log("Error Firebase:", err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const usuarios = [...usuariosBase, ...usuariosFirebase];

    const user = usuarios.find(
      (u) => u.username === username && u.password === password
    );

    if (user) onLogin(user);
    else setError("Credenciales inválidas.");
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
    </div>
  );
}

export default Login;
