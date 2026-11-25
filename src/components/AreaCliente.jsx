import React, {
  useEffect,
  useState
} from 'react';

import AvatarPerfil from './AvatarPerfil';
import '../styles/AreaCliente.css';


function AreaCliente({
  usuario,
  onNavigate
}) {

  const idUsuario =
    usuario?.id_usuario ||
    usuario?.id;


  const primeiroNome =
    (
      usuario?.nome ||
      'Cliente'
    )
      .trim()
      .split(' ')[0];


  const [pedidos, setPedidos] =
    useState([]);


  const [carregando, setCarregando] =
    useState(true);


  useEffect(() => {

    if (!idUsuario) {

      setCarregando(false);

      return;

    }


    fetch('/api/pedidos')

      .then((res) => {

        if (!res.ok) {
          throw new Error();
        }

        return res.json();

      })

      .then((data) => {

        if (!Array.isArray(data)) {

          setPedidos([]);

          return;

        }


        const pedidosCliente =
          data.filter(
            (pedido) =>
              Number(
                pedido.clienteId ||
                pedido.id_cliente
              ) ===
              Number(idUsuario)
          );


        setPedidos(
          pedidosCliente
        );

      })

      .catch(() => {

        setPedidos([]);

      })

      .finally(() => {

        setCarregando(false);

      });

  }, [idUsuario]);


  const normalizarStatus = (
    pedido
  ) => {

    return (
      pedido.statusKanban ||
      pedido.status_kanban ||
      pedido.statusPedido ||
      pedido.status_pedido ||
      'Aberto'
    )
      .toString()
      .trim();

  };


  const pedidosEmAndamento =
    pedidos.filter(
      (pedido) => {

        const status =
          normalizarStatus(
            pedido
          )
            .toLowerCase();


        return (
          status !== 'cancelado' &&
          status !== 'entregue' &&
          status !== 'concluído' &&
          status !== 'concluido'
        );

      }
    );


  const pedidosConcluidos =
    pedidos.filter(
      (pedido) => {

        const status =
          normalizarStatus(
            pedido
          )
            .toLowerCase();


        return (
          status === 'entregue' ||
          status === 'concluído' ||
          status === 'concluido'
        );

      }
    );


  const formatarData = (
    valor
  ) => {

    if (!valor) {
      return '';
    }


    if (
      typeof valor === 'string' &&
      /^\d{4}-\d{2}-\d{2}/
        .test(valor)
    ) {

      const [
        ano,
        mes,
        dia
      ] =
        valor
          .split('T')[0]
          .split('-');


      return `${dia}/${mes}/${ano}`;

    }


    const data =
      new Date(valor);


    if (
      isNaN(
        data.getTime()
      )
    ) {
      return '';
    }


    return data.toLocaleDateString(
      'pt-BR'
    );

  };


  const extrairTitulo = (
    descricao
  ) => {

    if (!descricao) {
      return 'Pedido de costura';
    }


    const match =
      descricao.match(
        /^\[([^\]]+)\]/
      );


    if (match) {
      return match[1];
    }


    return 'Pedido de costura';

  };


  const pedidosRecentes =
    [...pedidos]
      .sort(
        (a, b) =>
          new Date(
            b.dataPublicacao ||
            b.data_publicacao ||
            0
          ) -
          new Date(
            a.dataPublicacao ||
            a.data_publicacao ||
            0
          )
      )
      .slice(
        0,
        3
      );


  const atalhos = [

    {
      titulo:
        'Novo pedido',

      descricao:
        'Conte o que você precisa e publique uma nova solicitação.',

      icone:
        '+',

      tela:
        'publicarPedido'
    },

    {
      titulo:
        'Meus pedidos',

      descricao:
        'Acompanhe propostas, andamento, provas e entregas.',

      icone:
        '✂',

      tela:
        'meusPedidos'
    },

    {
      titulo:
        'Conversas',

      descricao:
        'Continue suas negociações diretamente com as costureiras.',

      icone:
        '♡',

      tela:
        'meusChats'
    },

    {
      titulo:
        'Meu perfil',

      descricao:
        'Consulte e atualize seus dados pessoais e de contato.',

      icone:
        '○',

      tela:
        'perfil'
    }

  ];


  return (

    <main className="cliente-page">


      {/* =====================================
          APRESENTAÇÃO
      ====================================== */}

      <section className="cliente-hero">

        <div className="cliente-hero-conteudo">

          <span className="cliente-eyebrow">
            Área do cliente
          </span>


          <h1>
            Olá, {primeiroNome}.
          </h1>


          <p>
            Encontre serviços de costura,
            acompanhe seus pedidos e converse
            diretamente com as profissionais
            responsáveis pelo seu atendimento.
          </p>


          <div className="cliente-hero-acoes">

            <button
              type="button"

              className="cliente-botao-principal"

              onClick={() =>
                onNavigate &&
                onNavigate(
                  'publicarPedido'
                )
              }
            >
              + Criar novo pedido
            </button>


            <button
              type="button"

              className="cliente-botao-secundario"

              onClick={() =>
                onNavigate &&
                onNavigate(
                  'meusPedidos'
                )
              }
            >
              Ver meus pedidos
            </button>

          </div>

        </div>


        <div className="cliente-identidade">

          <AvatarPerfil
            usuario={
              usuario
            }

            tamanho={
              72
            }

            onClick={() =>
              onNavigate &&
              onNavigate(
                'perfil'
              )
            }
          />


          <div>

            <span>
              Conta de cliente
            </span>

            <strong>
              {usuario?.nome ||
               'Cliente'}
            </strong>

            <small>
              {usuario?.email ||
               ''}
            </small>

          </div>

        </div>

      </section>


      {/* =====================================
          RESUMO
      ====================================== */}

      <section className="cliente-resumo">

        <article>

          <span>
            Todos
          </span>

          <strong>
            {carregando
              ? '—'
              : pedidos.length
            }
          </strong>

          <p>
            pedidos publicados
          </p>

        </article>


        <article>

          <span>
            Em andamento
          </span>

          <strong>
            {carregando
              ? '—'
              : pedidosEmAndamento.length
            }
          </strong>

          <p>
            pedidos ativos
          </p>

        </article>


        <article>

          <span>
            Finalizados
          </span>

          <strong>
            {carregando
              ? '—'
              : pedidosConcluidos.length
            }
          </strong>

          <p>
            serviços concluídos
          </p>

        </article>

      </section>


      {/* =====================================
          ATALHOS
      ====================================== */}

      <section className="cliente-secao">

        <div className="cliente-secao-header">

          <div>

            <span className="cliente-eyebrow">
              Acesso rápido
            </span>

            <h2>
              O que deseja fazer?
            </h2>

          </div>

        </div>


        <div className="cliente-atalhos">

          {atalhos.map(
            (atalho) => (

              <button
                type="button"

                key={
                  atalho.tela
                }

                className="cliente-atalho"

                onClick={() =>
                  onNavigate &&
                  onNavigate(
                    atalho.tela
                  )
                }
              >

                <span className="cliente-atalho-icone">
                  {atalho.icone}
                </span>


                <div>

                  <strong>
                    {atalho.titulo}
                  </strong>


                  <p>
                    {atalho.descricao}
                  </p>

                </div>


                <span className="cliente-atalho-seta">
                  →
                </span>

              </button>

            )
          )}

        </div>

      </section>


      {/* =====================================
          PEDIDOS RECENTES
      ====================================== */}

      <section className="cliente-secao">

        <div className="cliente-secao-header">

          <div>

            <span className="cliente-eyebrow">
              Acompanhamento
            </span>


            <h2>
              Pedidos recentes
            </h2>

          </div>


          <button
            type="button"

            className="cliente-link"

            onClick={() =>
              onNavigate &&
              onNavigate(
                'meusPedidos'
              )
            }
          >
            Ver todos →
          </button>

        </div>


        {carregando ? (

          <div className="cliente-estado">
            Carregando seus pedidos...
          </div>

        ) : pedidosRecentes.length === 0 ? (

          <div className="cliente-vazio">

            <div className="cliente-vazio-icone">
              ✂
            </div>


            <strong>
              Você ainda não publicou pedidos
            </strong>


            <p>
              Crie seu primeiro pedido e ele
              aparecerá aqui para acompanhamento.
            </p>


            <button
              type="button"

              onClick={() =>
                onNavigate &&
                onNavigate(
                  'publicarPedido'
                )
              }
            >
              Criar primeiro pedido
            </button>

          </div>

        ) : (

          <div className="cliente-pedidos-recentes">

            {pedidosRecentes.map(
              (pedido) => {

                const idPedido =
                  pedido.id ||
                  pedido.id_pedido;


                const status =
                  normalizarStatus(
                    pedido
                  );


                return (

                  <article
                    key={
                      idPedido
                    }

                    className="cliente-pedido-card"
                  >

                    <div className="cliente-pedido-topo">

                      <div>

                        <span>
                          Pedido #{idPedido}
                        </span>


                        <strong>
                          {
                            extrairTitulo(
                              pedido.descricao
                            )
                          }
                        </strong>

                      </div>


                      <span className="cliente-status">
                        {status}
                      </span>

                    </div>


                    <div className="cliente-pedido-rodape">

                      <span>

                        {formatarData(
                          pedido.dataPublicacao ||
                          pedido.data_publicacao
                        )}

                      </span>


                      <button
                        type="button"

                        onClick={() =>
                          onNavigate &&
                          onNavigate(
                            'meusPedidos'
                          )
                        }
                      >
                        Ver pedido →
                      </button>

                    </div>

                  </article>

                );

              }
            )}

          </div>

        )}

      </section>


      {/* =====================================
          AJUDA
      ====================================== */}

      <section className="cliente-ajuda">

        <div>

          <span className="cliente-eyebrow">
            Comunicação
          </span>


          <h2>
            Suas conversas ficam em um só lugar
          </h2>


          <p>
            Quando uma costureira demonstrar
            interesse ou houver negociação em
            um pedido, você poderá acompanhar
            tudo pela área de conversas.
          </p>

        </div>


        <button
          type="button"

          onClick={() =>
            onNavigate &&
            onNavigate(
              'meusChats'
            )
          }
        >
          Abrir conversas
        </button>

      </section>

    </main>

  );

}


export default AreaCliente;