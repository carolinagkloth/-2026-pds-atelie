import React from 'react';
import BotaoNotificacoes from './BotaoNotificacoes';
import '../styles/MenuPrincipal.css';


function MenuPrincipal({
  usuario,
  telaAtual,
  onNavigate
}) {

  const tipoUsuario =
    (
      usuario?.tipo_usuario ||
      usuario?.tipoUsuario ||
      ''
    )
      .toString()
      .toLowerCase();


  const isCostureira =
    tipoUsuario === 'costureira';


  const itens =
    isCostureira

      ? [

          {
            tela:
              'feedPedidos',

            label:
              'Mural de pedidos'
          },

          {
            tela:
              'meusChats',

            label:
              'Conversas'
          },

          {
            tela:
              'configuracoesNotificacoes',

            label:
              'Notificações'
          },

          {
            tela:
              'perfil',

            label:
              'Perfil e agenda'
          }

        ]

      : [

          {
            tela:
              'areaCliente',

            label:
              'Área do cliente'
          },

          {
            tela:
              'meusPedidos',

            label:
              'Meus pedidos'
          },

          {
            tela:
              'publicarPedido',

            label:
              'Novo pedido'
          },

          {
            tela:
              'meusChats',

            label:
              'Conversas'
          },

          {
            tela:
              'perfil',

            label:
              'Meu perfil'
          }

        ];


  const navegar = (
    tela
  ) => {

    if (onNavigate) {

      onNavigate(
        tela
      );

    }

  };


  return (

    <nav className="menu-principal">

      <div className="menu-principal-inner">


        <button
          type="button"

          className="menu-marca"

          onClick={() =>
            navegar(
              isCostureira
                ? 'feedPedidos'
                : 'areaCliente'
            )
          }
        >

          <span className="menu-marca-pequeno">
            Ateliê
          </span>

          <strong>
            Entre Linhas
          </strong>

        </button>


        <div className="menu-links">

          {itens.map(
            (item) => (

              <button
                key={
                  item.tela
                }

                type="button"

                className={
                  telaAtual === item.tela

                    ? 'menu-link menu-link-ativo'

                    : 'menu-link'
                }

                onClick={() =>
                  navegar(
                    item.tela
                  )
                }
              >
                {item.label}
              </button>

            )
          )}

        </div>


        <div className="menu-notificacoes">

          <BotaoNotificacoes
            usuario={
              usuario
            }

            onNavigate={
              onNavigate
            }
          />

        </div>

      </div>

    </nav>

  );

}


export default MenuPrincipal;