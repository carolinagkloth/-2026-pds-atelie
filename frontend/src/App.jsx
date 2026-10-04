import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Pedidos from "./pages/Pedidos";
import PerfilCostureira from "./pages/PerfilCostureira";


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
    </Routes>
  );
}

export default App;