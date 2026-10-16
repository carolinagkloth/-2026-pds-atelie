import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Pedidos from "./pages/Pedidos";
import PerfilCostureira from "./pages/PerfilCostureira";
import Cliente from "./pages/Cliente";
import FeedPedidos from "./pages/FeedPedidos";
import MensagensCostureira from "./pages/MensagensCostureira";


function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/pedidos" element={<Pedidos />} />
      <Route
        path="/perfil-costureira"
        element={<PerfilCostureira />} />
      <Route path="/costureira" element={<Pedidos />} />
      <Route path="/cliente" element={<Cliente />} />
      <Route
        path="/feed-pedidos"
        element={<FeedPedidos />} />
      <Route
        path="/mensagens-costureira"
        element={<MensagensCostureira />}/>
    </Routes>
  );
}

export default App;