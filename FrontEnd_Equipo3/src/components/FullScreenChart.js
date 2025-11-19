import React from "react";

const FullScreenChart = ({ chart, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.9)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        padding: "20px",
      }}
    >
      <button
        onClick={onClose}
        style={{
          alignSelf: "flex-end",
          padding: "10px 18px",
          background: "#ff5252",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          color: "white",
          fontSize: "15px",
        }}
      >
        Cerrar
      </button>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "90%", height: "90%" }}>{chart}</div>
      </div>
    </div>
  );
};

export default FullScreenChart;
