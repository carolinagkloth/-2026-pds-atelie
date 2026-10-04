import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="header">
      <h1>Ateliê entre Linhas</h1>

      <nav>
        <Link to="/">Início</Link>
        <Link to="/pedidos">Pedidos disponíveis</Link>
        <Link to="/login">Entrar</Link>
        <a href="/#contato">Contato</a>
        <Link to="/perfil-costureira">Meu perfil</Link>
      </nav>
    </header>
  );
}

export default Header;