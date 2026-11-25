import React, { useState, useEffect } from 'react';
import AvatarPerfil from './AvatarPerfil';
import '../styles/FeedPedidos.css';


function FeedPedidos({
  usuario,
  usuarioLogado,
  onNavigate,
  onDemonstrarInteresse
}) {

  const usuarioSalvo = (() => {

    try {

      const item =
        localStorage.getItem(
          'usuarioAtelie'
        );


      return item &&
        item !== 'undefined'
        ? JSON.parse(item)
        : {};

    } catch {

      return {};

    }

  })();


  const usuarioAtual =
    usuario ||
    usuarioLogado ||
    usuarioSalvo;


  const isCostureira =
    (
      usuarioAtual?.tipo_usuario ||
      usuarioAtual?.tipoUsuario ||
      ''
    )
      .toString()
      .toLowerCase() ===
    'costureira';


  const [pedidos, setPedidos] =
    useState([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');


  const [
    filtroServico,
    setFiltroServico
  ] = useState('Todos');


  const [
    buscaLocalizacao,
    setBuscaLocalizacao
  ] = useState('');


  const [
    filtroPrazo,
    setFiltroPrazo
  ] = useState('');


  const normalizarTexto = (
    texto
  ) => {

    return texto

      ? texto
          .normalize('NFD')
          .replace(
            /[\u0300-\u036f]/g,
            ''
          )
          .toLowerCase()

      : '';

  };


  useEffect(() => {

    fetch('/api/pedidos')

      .then((res) => {

        if (!res.ok) {

          throw new Error(
            'Erro ao carregar o mural de pedidos.'
          );

        }


        return res.json();

      })

      .then((data) => {

        if (
          Array.isArray(data)
        ) {

          setPedidos(data);

        } else {

          setPedidos([]);

        }

      })

      .catch((err) => {

        setErro(
          err.message
        );

      })

      .finally(() => {

        setCarregando(
          false
        );

      });

  }, []);


  const extrairInformacoes = (
    texto,
    localizacaoPadrao
  ) => {

    if (!texto) {

      return {

        tipo:
          'Pedido de Costura',

        localizacao:
          localizacaoPadrao ||
          'Não informada',

        descricao:
          ''

      };

    }


    let tipo =
      'Pedido de Costura';


    let localizacao =
      localizacaoPadrao ||
      'Não informada';


    let descricao =
      texto;


    if (
      texto.includes(
        'Localização:'
      )
    ) {

      const partes =
        texto.split(
          'Localização:'
        );


      const tipoExtraido =
        partes[0]
          .replace(
            /[\[\]]/g,
            ''
          )
          .replace(
            /\s*-\s*$/,
            ''
          )
          .trim();


      if (tipoExtraido) {

        tipo =
          tipoExtraido;

      }


      const resto =
        partes[1]
          .trim();


      const quebraDupla =
        resto.indexOf(
          '\n\n'
        );


      if (
        quebraDupla !== -1
      ) {

        localizacao =
          resto
            .substring(
              0,
              quebraDupla
            )
            .trim();


        descricao =
          resto
            .substring(
              quebraDupla
            )
            .trim();

      } else {

        const primeiraLinha =
          resto.split(
            '\n'
          )[0];


        localizacao =
          primeiraLinha
            .trim();


        descricao =
          resto
            .substring(
              primeiraLinha.length
            )
            .trim();

      }

    } else {

      const matchColchetes =
        texto.match(
          /^\[([^\]]+)\]\s*(?:-?\s*)([\s\S]*)$/
        );


      if (matchColchetes) {

        tipo =
          matchColchetes[1]
            .trim();


        descricao =
          matchColchetes[2]
            .trim();

      }

    }


    return {

      tipo,
      localizacao,
      descricao

    };

  };


  const formatarData = (
    dataIso
  ) => {

    if (!dataIso) {

      return '-';

    }


    if (
      typeof dataIso ===
        'string' &&
      /^\d{4}-\d{2}-\d{2}/
        .test(dataIso)
    ) {

      const [
        ano,
        mes,
        dia
      ] =
        dataIso
          .split('T')[0]
          .split('-');


      return `${dia}/${mes}/${ano}`;

    }


    const data =
      new Date(
        dataIso
      );


    return isNaN(
      data.getTime()
    )

      ? '-'

      : data
          .toLocaleDateString(
            'pt-BR',
            {
              timeZone:
                'America/Sao_Paulo'
            }
          );

  };


  const extrairMesAno = (
    dataIso
  ) => {

    if (!dataIso) {

      return '';

    }


    if (
      typeof dataIso ===
        'string' &&
      /^\d{4}-\d{2}/
        .test(dataIso)
    ) {

      return dataIso
        .split('T')[0]
        .substring(
          0,
          7
        );

    }


    const d =
      new Date(
        dataIso
      );


    if (
      isNaN(
        d.getTime()
      )
    ) {

      return '';

    }


    const ano =
      d.getFullYear();


    const mes =
      String(
        d.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    return `${ano}-${mes}`;

  };


  const handleInteresse = (
    pedido
  ) => {

    if (
      onDemonstrarInteresse
    ) {

      onDemonstrarInteresse(
        pedido
      );

    } else if (
      onNavigate
    ) {

      onNavigate(
        'chat',
        pedido
      );

    }

  };


  const listaPedidos =
    Array.isArray(
      pedidos
    )
      ? pedidos
      : [];


  const pedidosFiltrados =
    listaPedidos.filter(
      (pedido) => {

        const info =
          extrairInformacoes(
            pedido.descricao,
            pedido.localizacao
          );


        const statusAtual =
          pedido.status ||
          pedido.status_pedido;


        const statusAberto =
          statusAtual ===
            'Aberto' ||
          statusAtual ===
            'Disponível' ||
          !statusAtual;


        const tipoNorm =
          normalizarTexto(
            info.tipo
          );


        const filtroServicoNorm =
          normalizarTexto(
            filtroServico
          );


        const atendeServico =
          filtroServico ===
            'Todos' ||
          tipoNorm.includes(
            filtroServicoNorm
          );


        const localNorm =
          normalizarTexto(
            info.localizacao
          );


        const buscaLocalNorm =
          normalizarTexto(
            buscaLocalizacao
          );


        const atendeLocal =
          localNorm.includes(
            buscaLocalNorm
          );


        const prazoPedido =
          pedido.prazoDesejado ||
          pedido.prazo_desejado;


        const mesAnoPedido =
          extrairMesAno(
            prazoPedido
          );


        const atendePrazo =
          !filtroPrazo ||
          mesAnoPedido ===
            filtroPrazo;


        return (
          statusAberto &&
          atendeServico &&
          atendeLocal &&
          atendePrazo
        );

      }
    );


  return (

    <main className="feed-pedidos-page">


      {/* =====================================
          CABEÇALHO
      ====================================== */}

      <section className="feed-pedidos-header">

        <div className="feed-pedidos-heading">

          <span className="feed-pedidos-eyebrow">
            Área da costureira
          </span>


          <h1>
            Pedidos disponíveis
          </h1>


          {usuarioAtual?.nome && (

            <p>

              Olá,{' '}

              <strong>
                {usuarioAtual.nome}
              </strong>

              . Encontre novas solicitações
              compatíveis com seus serviços.

            </p>

          )}

        </div>


        <div className="feed-pedidos-header-actions">

          <button
            type="button"
            className="feed-button-secondary"

            onClick={() =>
              onNavigate &&
              onNavigate(
                'meusChats'
              )
            }
          >
            Conversas
          </button>


          <div className="feed-pedidos-counter">

            <span>
              Disponíveis
            </span>

            <strong>
              {
                pedidosFiltrados
                  .length
              }
            </strong>

          </div>


          <div className="feed-pedidos-avatar">

            <AvatarPerfil
              usuario={
                usuarioAtual
              }

              onClick={() =>
                onNavigate &&
                onNavigate(
                  'perfil'
                )
              }
            />

          </div>

        </div>

      </section>


      {/* =====================================
          FILTROS
      ====================================== */}

      <section className="feed-pedidos-filters">

        <div className="feed-pedidos-filter-header">

          <div>

            <span className="feed-pedidos-filter-eyebrow">
              Busca
            </span>

            <h2>
              Encontrar pedidos
            </h2>

          </div>


          <p>
            Use os filtros para encontrar
            solicitações mais próximas
            do seu perfil de trabalho.
          </p>

        </div>


        <div className="feed-pedidos-filter-grid">


          {/* TIPO */}

          <div className="feed-pedidos-field">

            <label>
              Tipo de serviço
            </label>


            <select
              value={
                filtroServico
              }

              onChange={(e) =>
                setFiltroServico(
                  e.target.value
                )
              }
            >

              <option value="Todos">
                Todos os serviços
              </option>


              <option value="Ajuste / Conserto">
                Ajuste / Conserto
              </option>


              <option value="Confecção sob Medida">
                Confecção sob Medida
              </option>


              <option value="Customização / Bordado">
                Customização / Bordado
              </option>


              <option value="Vestido de Festa">
                Vestido de Festa
              </option>


              <option value="Outros">
                Outros
              </option>

            </select>

          </div>


          {/* LOCALIZAÇÃO */}

          <div className="feed-pedidos-field">

            <label>
              Bairro ou cidade
            </label>


            <input
              type="text"

              placeholder="Ex.: Centro, Ponta Grossa..."

              value={
                buscaLocalizacao
              }

              onChange={(e) =>
                setBuscaLocalizacao(
                  e.target.value
                )
              }
            />

          </div>


          {/* PRAZO */}

          <div className="feed-pedidos-field">

            <label>
              Prazo desejado
            </label>


            <div className="feed-pedidos-month-field">

              <input
                type="month"

                value={
                  filtroPrazo
                }

                onChange={(e) =>
                  setFiltroPrazo(
                    e.target.value
                  )
                }
              />


              {filtroPrazo && (

                <button
                  type="button"

                  className="feed-pedidos-clear"

                  onClick={() =>
                    setFiltroPrazo('')
                  }

                  title="Limpar filtro de mês/ano"
                >
                  ×
                </button>

              )}

            </div>

          </div>

        </div>

      </section>


      {/* =====================================
          CARREGAMENTO
      ====================================== */}

      {carregando && (

        <div className="feed-pedidos-state">

          <div className="feed-pedidos-spinner" />

          <span>
            Carregando pedidos do mural...
          </span>

        </div>

      )}


      {/* =====================================
          ERRO
      ====================================== */}

      {erro && (

        <div className="feed-pedidos-error">

          <span className="feed-pedidos-error-icon">
            !
          </span>

          <span>
            {erro}
          </span>

        </div>

      )}


      {/* =====================================
          LISTA
      ====================================== */}

      {!carregando &&
       pedidosFiltrados.length === 0 ? (

        <div className="feed-pedidos-empty">

          <div className="feed-pedidos-empty-icon">
            ✂
          </div>


          <span className="feed-pedidos-empty-label">
            Nenhum resultado
          </span>


          <h3>
            Nenhum pedido encontrado
          </h3>


          <p>
            Tente alterar os filtros
            de busca ou aguarde novas
            publicações dos clientes.
          </p>

        </div>

      ) : (

        <div className="feed-pedidos-list">

          {pedidosFiltrados.map(
            (pedido) => {

              const info =
                extrairInformacoes(
                  pedido.descricao,
                  pedido.localizacao
                );


              const prazoPedido =
                pedido.prazoDesejado ||
                pedido.prazo_desejado;


              return (

                <article
                  key={
                    pedido.id ||
                    pedido.id_pedido
                  }

                  className="feed-pedidos-card"
                >


                  {/* FOTO */}

                  {pedido.fotoReferencia ? (

                    <div className="feed-pedidos-card-image">

                      <img
                        src={
                          pedido.fotoReferencia
                        }

                        alt="Referência da peça"
                      />

                    </div>

                  ) : (

                    <div className="feed-pedidos-card-placeholder">

                      <span>
                        ✂
                      </span>

                    </div>

                  )}


                  {/* CONTEÚDO */}

                  <div className="feed-pedidos-card-content">


                    <div className="feed-pedidos-card-meta">

                      <span className="feed-pedidos-category">
                        {info.tipo}
                      </span>


                      <span className="feed-pedidos-date">
                        Publicado em{' '}
                        {formatarData(
                          pedido.dataPublicacao ||
                          pedido.data_publicacao
                        )}
                      </span>

                    </div>


                    <span className="feed-pedidos-card-eyebrow">
                      Solicitação de cliente
                    </span>


                    <h3>
                      {
                        pedido.clienteNome ||
                        pedido.cliente_nome ||
                        'Cliente'
                      }
                    </h3>


                    <p className="feed-pedidos-description">

                      {info.descricao ||
                        'O cliente não adicionou uma descrição.'}

                    </p>


                    <div className="feed-pedidos-details">

                      <div className="feed-pedidos-detail">

                        <div className="feed-pedidos-detail-icon">
                          ◉
                        </div>


                        <div>

                          <span>
                            Localização
                          </span>

                          <strong>
                            {info.localizacao}
                          </strong>

                        </div>

                      </div>


                      <div className="feed-pedidos-detail">

                        <div className="feed-pedidos-detail-icon">
                          ◷
                        </div>


                        <div>

                          <span>
                            Prazo
                          </span>

                          <strong>
                            {
                              formatarData(
                                prazoPedido
                              )
                            }
                          </strong>

                        </div>

                      </div>

                    </div>


                    {/* AÇÃO */}

                    <div className="feed-pedidos-card-footer">

                      {isCostureira ? (

                        <button
                          type="button"

                          className="feed-pedidos-interest-button"

                          onClick={() =>
                            handleInteresse(
                              pedido
                            )
                          }
                        >
                          Demonstrar interesse

                          <span>
                            →
                          </span>
                        </button>

                      ) : (

                        <div className="feed-pedidos-restricted">

                          Apenas contas de
                          Costureira podem aceitar
                          solicitações.

                        </div>

                      )}

                    </div>

                  </div>

                </article>

              );

            }
          )}

        </div>

      )}

    </main>

  );

}


export default FeedPedidos;