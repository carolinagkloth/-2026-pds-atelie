import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Pedidos from "./pages/Pedidos";
import PerfilCostureira from "./pages/PerfilCostureira";
import Cliente from "./pages/Cliente";
import FeedPedidos from "./pages/FeedPedidos";
import MensagensCostureira from "./pages/MensagensCostureira";
import RotaProtegida from "./components/RotaProtegida";

function App() {
  return (
    <Routes>

      {/* ROTAS PÚBLICAS */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/cadastro"
        element={<Cadastro />}
      />


      {/* ÁREA DO CLIENTE */}

      <Route
        path="/cliente"
        element={
          <RotaProtegida tipoPermitido="Cliente">
            <Cliente />
          </RotaProtegida>
        }
      />


      {/* ÁREA DA COSTUREIRA */}

      <Route
        path="/costureira"
        element={
          <RotaProtegida tipoPermitido="Costureira">
            <Pedidos />
          </RotaProtegida>
        }
      />

      <Route
        path="/pedidos"
        element={
          <RotaProtegida tipoPermitido="Costureira">
            <Pedidos />
          </RotaProtegida>
        }
      />

      <Route
        path="/feed-pedidos"
        element={
          <RotaProtegida tipoPermitido="Costureira">
            <FeedPedidos />
          </RotaProtegida>
        }
      />

      <Route
        path="/mensagens-costureira"
        element={
          <RotaProtegida tipoPermitido="Costureira">
            <MensagensCostureira />
          </RotaProtegida>
        }
      />

      <Route
        path="/perfil-costureira"
        element={
          <RotaProtegida tipoPermitido="Costureira">
            <PerfilCostureira />
          </RotaProtegida>
        }
      />

    </Routes>
  );
}

export default App;