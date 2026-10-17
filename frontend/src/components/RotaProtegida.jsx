import { Navigate } from "react-router-dom";

function RotaProtegida({
  tipoPermitido,
  children,
}) {
  const token =
    localStorage.getItem("token");

  const usuarioSalvo =
    localStorage.getItem("usuario");

  if (!token || !usuarioSalvo) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  let usuario;

  try {
    usuario =
      JSON.parse(usuarioSalvo);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    usuario.tipo_usuario !==
    tipoPermitido
  ) {
    if (
      usuario.tipo_usuario ===
      "Cliente"
    ) {
      return (
        <Navigate
          to="/cliente"
          replace
        />
      );
    }

    if (
      usuario.tipo_usuario ===
      "Costureira"
    ) {
      return (
        <Navigate
          to="/costureira"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

export default RotaProtegida;