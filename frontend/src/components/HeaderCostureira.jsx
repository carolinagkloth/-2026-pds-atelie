import { NavLink } from "react-router-dom";

function HeaderCostureira() {
  return (
    <header className="header-costureira">

      <div className="header-costureira-conteudo">

        <div className="marca-costureira">
          <span>Ateliê</span>
          <small>entre Linhas</small>
        </div>

        <nav className="menu-costureira">

          <NavLink to="/costureira">
            Início
          </NavLink>

          <NavLink to="/feed-pedidos">
            Feed de pedidos
          </NavLink>

          <a href="#meus-trabalhos">
            Meus trabalhos
          </a>

          <a href="#agenda">
            Agenda
          </a>

          <NavLink to="/mensagens-costureira">
            Mensagens
          </NavLink>

          <NavLink to="/perfil-costureira">
            Meu perfil
          </NavLink>

        </nav>

      </div>

    </header>
  );
}

export default HeaderCostureira;