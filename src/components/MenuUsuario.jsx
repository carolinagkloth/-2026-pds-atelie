import React from 'react';

import '../styles/MenuUsuario.css';


function MenuUsuario({
  usuario,
  telaAtual,
  onNavigate,
  onLogout
}) {

  const tipoUsuario = (
    usuario?.tipo_usuario ||
    usuario?.tipoUsuario ||
    ''
  )
    .toString()
    .toLowerCase();


  const isCliente =
    tipoUsuario !== 'costureira';


  return (

    <header className="menu-usuario">

      <div className="menu-usuario-conteudo">


        <button
          type="button"
          className="menu-usuario-marca"
          onClick={() =>
            onNavigate(
              isCliente
                ? 'meusPedidos'
                : 'feedPedidos'
            )
          }
        >

          <span>
            Ateliê
          </span>

          <small>
            entre Linhas
          </small>

        </button>



        <nav className="menu-usuario-nav">


          {isCliente ? (

            <>

              <button
                type="button"
                className={
                  telaAtual === 'meusPedidos'
                    ? 'menu-usuario-link ativo'
                    : 'menu-usuario-link'
                }
                onClick={() =>
                  onNavigate('meusPedidos')
                }
              >
                Meus pedidos
              </button>


              <button
                type="button"
                className={
                  telaAtual === 'publicarPedido'
                    ? 'menu-usuario-link ativo'
                    : 'menu-usuario-link'
                }
                onClick={() =>
                  onNavigate('publicarPedido')
                }
              >
                Novo pedido
              </button>


              <button
                type="button"
                className={
                  telaAtual === 'chat'
                    ? 'menu-usuario-link ativo'
                    : 'menu-usuario-link'
                }
                onClick={() =>
                  onNavigate('chat')
                }
              >
                Mensagens
              </button>


              <button
                type="button"
                className={
                  telaAtual === 'perfil'
                    ? 'menu-usuario-link ativo'
                    : 'menu-usuario-link'
                }
                onClick={() =>
                  onNavigate('perfil')
                }
              >
                Meu perfil
              </button>

            </>

          ) : (

            <>

              <button
                type="button"
                className={
                  telaAtual === 'feedPedidos'
                    ? 'menu-usuario-link ativo'
                    : 'menu-usuario-link'
                }
                onClick={() =>
                  onNavigate('feedPedidos')
                }
              >
                Feed de pedidos
              </button>


              <button
                type="button"
                className={
                  telaAtual === 'chat'
                    ? 'menu-usuario-link ativo'
                    : 'menu-usuario-link'
                }
                onClick={() =>
                  onNavigate('chat')
                }
              >
                Mensagens
              </button>


              <button
                type="button"
                className={
                  telaAtual === 'perfil'
                    ? 'menu-usuario-link ativo'
                    : 'menu-usuario-link'
                }
                onClick={() =>
                  onNavigate('perfil')
                }
              >
                Meu perfil
              </button>

            </>

          )}


        </nav>



        <div className="menu-usuario-direita">

          <div className="menu-usuario-pessoa">

            <span>
              {usuario?.nome ||
                (
                  isCliente
                    ? 'Cliente'
                    : 'Costureira'
                )}
            </span>

            <small>
              {isCliente
                ? 'Cliente'
                : 'Costureira'}
            </small>

          </div>


          <button
            type="button"
            className="menu-usuario-sair"
            onClick={
              onLogout
            }
          >
            Sair
          </button>

        </div>


      </div>

    </header>

  );

}


export default MenuUsuario;