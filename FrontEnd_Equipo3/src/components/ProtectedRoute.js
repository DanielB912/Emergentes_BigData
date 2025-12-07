import React from "react";

function ProtectedRoute({ user, children }) {
  if (!user) {
    return (
      <div className="unauthorized">
        <h3>Acceso restringido</h3>
        <p>Por favor inicia sesión para continuar.</p>
      </div>
    );
  }
  return <>{children}</>;
}

export default ProtectedRoute;
