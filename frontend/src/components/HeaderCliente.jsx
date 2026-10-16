import { useState } from "react";

function HeaderCliente({
  telaAtual,
  onAbrirInicio,
  onAbrirMeusPedidos,
  onAbrirMensagens,
}) {
  const [notificacoesAbertas, setNotificacoesAbertas] =
    useState(false);

  return (
    <header className="header-cliente">
      <div className="header-cliente-conteudo">

        <div className="marca-cliente">
          <span>Ateliê</span>
          <small>entre Linhas</small>
        </div>

        <nav className="menu-cliente">

          <button
            type="button"
            className={
              telaAtual === "inicio"
                ? "menu-cliente-link ativo"
                : "menu-cliente-link"
            }
            onClick={onAbrirInicio}
          >
            Início
          </button>

          <button
            type="button"
            className={
              telaAtual === "pedidos"
                ? "menu-cliente-link ativo"
                : "menu-cliente-link"
            }
            onClick={onAbrirMeusPedidos}
          >
            Meus pedidos
          </button>

          <button
            type="button"
            className={
              telaAtual === "mensagens"
                ? "menu-cliente-link ativo"
                : "menu-cliente-link"
            }
            onClick={onAbrirMensagens}
          >
            Mensagens
          </button>

          <button
            type="button"
            className="menu-cliente-link"
          >
            Meu perfil
          </button>

        </nav>

        <div className="notificacao-cliente">

          <button
            type="button"
            className="botao-notificacao"
            onClick={() =>
              setNotificacoesAbertas(
                !notificacoesAbertas
              )
            }
            aria-label="Notificações"
          >
            🔔
          </button>

          {notificacoesAbertas && (
            <div className="notificacoes-dropdown">

              <h3>Notificações</h3>

              <p className="notificacoes-vazio">
                Nenhuma nova notificação.
              </p>

              <small>
                Avisos sobre provas, entregas e
                atualizações dos seus pedidos
                aparecerão aqui.
              </small>

            </div>
          )}

        </div>

      </div>
    </header>
  );
}

export default HeaderCliente;