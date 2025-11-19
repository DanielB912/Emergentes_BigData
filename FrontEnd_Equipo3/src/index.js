import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Crea el punto raíz donde se montará React
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
