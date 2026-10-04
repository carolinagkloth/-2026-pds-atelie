import { Link, NavLink } from "react-router-dom";

function HeaderCostureira() {
  return (
    <header className="header-costureira">
      <div className="header-costureira-conteudo">
        <Link to="/costureira" className="marca-costureira">
          <span>Ateliê</span>
          <small>entre Linhas</small>
        </Link>

        <nav className="menu-costureira">
          <NavLink to="/costureira">
            Início
          </NavLink>

          <a href="#meus-trabalhos">
            Meus trabalhos
          </a>

          <a href="#agenda">
            Agenda
          </a>

          <a href="#mensagens">
            Mensagens
          </a>

          <NavLink to="/perfil-costureira">
            Meu perfil
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default HeaderCostureira;