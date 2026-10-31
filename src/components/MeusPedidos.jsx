import React, { useState, useEffect } from 'react';
import "../styles/MeusPedidos.css";

function MeusPedidos({ usuario, onNavigate }) {
  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const usuarioAtual =
    usuario && Object.keys(usuario).length > 0
      ? usuario
      : usuarioSalvo;

  const tipoFormatado = (
    usuarioAtual?.tipo_usuario ||
    usuarioAtual?.tipoUsuario ||
    'Cliente'
  )
    .toString()
    .toLowerCase();

  const isCliente = tipoFormatado === 'cliente';

  const idCliente =
    usuarioAtual?.id_usuario ||
    usuarioAtual?.id;

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/pedidos')
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            'Erro ao carregar a lista de pedidos.'
          );
        }

        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const listaFiltrada = isCliente
            ? data.filter(
                (p) =>
                  Number(p.clienteId) ===
                  Number(idCliente)
              )
            : data;

          setPedidos(listaFiltrada);
        } else {
          setPedidos([]);
        }
      })
      .catch((err) => {
        setErro(err.message);
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [idCliente, isCliente]);

  const handleCancelarPedido = async (idPedido) => {
    const confirmacao = window.confirm(
      'Tem certeza de que deseja cancelar este pedido?'
    );

    if (!confirmacao) return;

    try {
      const response = await fetch(
        `/api/pedidos/${idPedido}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro ||
          'Erro ao cancelar o pedido.'
        );
      }

      setPedidos((pedidosAnteriores) =>
        pedidosAnteriores.filter(
          (p) => p.id !== idPedido
        )
      );

      alert(
        'Pedido cancelado com sucesso!'
      );
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const extrairInformacoes = (
    texto,
    localizacaoPadrao
  ) => {
    if (!texto) {
      return {
        tipo: 'Ajuste / Conserto',
        localizacao:
          localizacaoPadrao ||
          'Não informada',
        descricao: ''
      };
    }

    let tipo = 'Ajuste / Conserto';

    let localizacao =
      localizacaoPadrao ||
      'Não informada';

    let descricao = texto;

    if (texto.includes('Localização:')) {
      const partes =
        texto.split('Localização:');

      let tipoExtraido = partes[0]
        .replace('[', '')
        .replace(']', '')
        .replace('-', '')
        .trim();

      if (tipoExtraido) {
        if (
          tipoExtraido.toUpperCase() ===
          'AJUSTE'
        ) {
          tipo = 'Ajuste / Conserto';
        } else {
          tipo = tipoExtraido;
        }
      }

      const resto = partes[1].trim();

      const quebra =
        resto.indexOf('\n');

      if (quebra !== -1) {
        localizacao =
          resto
            .substring(0, quebra)
            .trim();

        descricao =
          resto
            .substring(quebra)
            .trim();
      } else {
        localizacao = resto;
        descricao = resto;
      }
    }

    return {
      tipo,
      localizacao,
      descricao
    };
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return '-';

    const data =
      new Date(dataIso);

    return data.toLocaleDateString(
      'pt-BR'
    );
  };


  /* ========================================
     RESUMO VISUAL
  ======================================== */

  const totalPedidos =
    pedidos.length;

  const pedidosAbertos =
    pedidos.filter((pedido) => {
      const status = (
        pedido.status || 'Aberto'
      )
        .toString()
        .toLowerCase();

      return (
        status === 'aberto' ||
        status === 'disponível' ||
        status === 'disponivel'
      );
    }).length;

  const pedidosAndamento =
    pedidos.filter((pedido) => {
      const status = (
        pedido.status || ''
      )
        .toString()
        .toLowerCase();

      return (
        status === 'em negociação' ||
        status === 'em negociacao' ||
        status === 'em andamento'
      );
    }).length;


  return (
    <div className="meus-pedidos-page">

      {/* ================================
          CABEÇALHO
      ================================= */}

      <section className="meus-pedidos-header">

        <div className="meus-pedidos-titulo-area">

          <span className="meus-pedidos-eyebrow">
            Área do cliente
          </span>

          <h1>
            Meus pedidos
          </h1>

          <p>
            {usuarioAtual?.nome
              ? `Olá, ${usuarioAtual.nome}. Acompanhe aqui suas solicitações de costura.`
              : 'Acompanhe aqui suas solicitações de costura.'}
          </p>

        </div>


        <button
          type="button"
          className="meus-pedidos-novo"
          onClick={() =>
            onNavigate &&
            onNavigate(
              'publicarPedido'
            )
          }
        >
          <span>+</span>
          Novo pedido
        </button>

      </section>


      {/* ================================
          RESUMO
      ================================= */}

      <section className="meus-pedidos-resumo">

        <div className="resumo-card">

          <span className="resumo-label">
            Total
          </span>

          <strong>
            {totalPedidos}
          </strong>

          <small>
            pedidos publicados
          </small>

        </div>


        <div className="resumo-card">

          <span className="resumo-label">
            Em aberto
          </span>

          <strong>
            {pedidosAbertos}
          </strong>

          <small>
            aguardando interesse
          </small>

        </div>


        <div className="resumo-card">

          <span className="resumo-label">
            Em andamento
          </span>

          <strong>
            {pedidosAndamento}
          </strong>

          <small>
            em negociação
          </small>

        </div>

      </section>


      {/* ================================
          LISTA
      ================================= */}

      <section className="meus-pedidos-conteudo">

        <div className="meus-pedidos-secao-header">

          <div>

            <span className="meus-pedidos-secao-eyebrow">
              Seus pedidos
            </span>

            <h2>
              Pedidos publicados
            </h2>

          </div>

        </div>


        {carregando && (

          <div className="pedidos-carregando">
            Carregando pedidos...
          </div>

        )}


        {erro && (

          <div className="pedidos-erro">
            {erro}
          </div>

        )}


        {!carregando &&
          !erro &&
          pedidos.length === 0 && (

          <div className="pedidos-vazio">

            <div className="pedidos-vazio-icone">
              ✂
            </div>

            <h3>
              Nenhum pedido publicado
            </h3>

            <p>
              Quando você publicar uma solicitação,
              ela aparecerá aqui para acompanhamento.
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
              Publicar meu primeiro pedido
            </button>

          </div>

        )}


        <div className="pedidos-lista">

          {pedidos.map((pedido) => {

            const info =
              extrairInformacoes(
                pedido.descricao,
                pedido.localizacao
              );


            const podeCancelar =
              isCliente &&
              (
                pedido.status === 'Aberto' ||
                pedido.status === 'Disponível' ||
                !pedido.status
              );


            const statusPedido =
              pedido.status ||
              'Aberto';


            return (

              <article
                key={pedido.id}
                className="pedido-item"
              >


                {pedido.fotoReferencia && (

                  <div className="pedido-imagem-area">

                    <img
                      src={
                        pedido.fotoReferencia
                      }
                      alt="Referência da peça"
                      className="pedido-imagem"
                    />

                  </div>

                )}


                <div className="pedido-conteudo">


                  <div className="pedido-topo">

                    <div>

                      <span className="pedido-tipo-label">
                        Solicitação
                      </span>

                      <h3>
                        {info.tipo}
                      </h3>

                    </div>


                    <div className="pedido-meta">

                      <span className="pedido-status">
                        {statusPedido}
                      </span>

                      <span className="pedido-data">
                        Publicado em{' '}
                        {formatarData(
                          pedido.dataPublicacao
                        )}
                      </span>

                    </div>

                  </div>


                  <div className="pedido-detalhes">


                    <div className="pedido-detalhe">

                      <span>
                        Localização
                      </span>

                      <strong>
                        {info.localizacao}
                      </strong>

                    </div>


                    <div className="pedido-detalhe pedido-descricao">

                      <span>
                        Descrição
                      </span>

                      <p>
                        {info.descricao ||
                          'Sem descrição informada.'}
                      </p>

                    </div>


                    <div className="pedido-detalhe">

                      <span>
                        Prazo desejado
                      </span>

                      <strong>
                        {formatarData(
                          pedido.prazoDesejado
                        )}
                      </strong>

                    </div>


                  </div>


                  {podeCancelar && (

                    <div className="pedido-acoes">

                      <button
                        type="button"
                        onClick={() =>
                          handleCancelarPedido(
                            pedido.id
                          )
                        }
                        className="pedido-cancelar-button"
                      >
                        Cancelar pedido
                      </button>

                    </div>

                  )}


                </div>

              </article>

            );

          })}

        </div>

      </section>

    </div>
  );
}

export default MeusPedidos;