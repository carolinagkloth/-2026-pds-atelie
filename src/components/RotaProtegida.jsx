import { Navigate } from "react-router-dom";

function RotaProtegida({
  usuarioLogado,
  tiposPermitidos,
  children,
}) {
  if (!usuarioLogado) {
    return <Navigate to="/login" replace />;
  }

  if (
    tiposPermitidos &&
    !tiposPermitidos.includes(
      usuarioLogado.tipo_usuario
    )
  ) {
    if (
      usuarioLogado.tipo_usuario ===
      "Cliente"
    ) {
      return (
        <Navigate
          to="/meus-pedidos"
          replace
        />
      );
    }

    if (
      usuarioLogado.tipo_usuario ===
      "Costureira"
    ) {
      return (
        <Navigate
          to="/mural"
          replace
        />
      );
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RotaProtegida;
