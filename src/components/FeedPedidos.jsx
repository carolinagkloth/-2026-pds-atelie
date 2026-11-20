import React, { useState, useEffect } from 'react';
import AvatarPerfil from './AvatarPerfil';

function FeedPedidos({
  usuario,
  usuarioLogado,
  onNavigate,
  onDemonstrarInteresse
}) {
  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined'
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
      .toLowerCase() === 'costureira';

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [filtroServico, setFiltroServico] = useState('Todos');
  const [buscaLocalizacao, setBuscaLocalizacao] = useState('');
  const [filtroPrazo, setFiltroPrazo] = useState('');

  const normalizarTexto = (texto) => {
    return texto
      ? texto
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
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
        if (Array.isArray(data)) {
          setPedidos(data);
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
  }, []);

  const extrairInformacoes = (
    texto,
    localizacaoPadrao
  ) => {
    if (!texto) {
      return {
        tipo: 'Pedido de Costura',
        localizacao:
          localizacaoPadrao ||
          'Não informada',
        descricao: ''
      };
    }

    let tipo = 'Pedido de Costura';
    let localizacao =
      localizacaoPadrao ||
      'Não informada';
    let descricao = texto;

    if (texto.includes('Localização:')) {
      const partes =
        texto.split('Localização:');

      const tipoExtraido =
        partes[0]
          .replace(/[\[\]]/g, '')
          .replace(/\s*-\s*$/, '')
          .trim();

      if (tipoExtraido) {
        tipo = tipoExtraido;
      }

      const resto =
        partes[1].trim();

      const quebraDupla =
        resto.indexOf('\n\n');

      if (quebraDupla !== -1) {
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
          resto.split('\n')[0];

        localizacao =
          primeiraLinha.trim();

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
          matchColchetes[1].trim();

        descricao =
          matchColchetes[2].trim();
      }
    }

    return {
      tipo,
      localizacao,
      descricao
    };
  };

  const formatarData = (dataIso) => {
    if (!dataIso) {
      return '-';
    }

    if (
      typeof dataIso === 'string' &&
      /^\d{4}-\d{2}-\d{2}/.test(dataIso)
    ) {
      const [ano, mes, dia] =
        dataIso
          .split('T')[0]
          .split('-');

      return `${dia}/${mes}/${ano}`;
    }

    const data =
      new Date(dataIso);

    return isNaN(data.getTime())
      ? '-'
      : data.toLocaleDateString(
          'pt-BR',
          {
            timeZone:
              'America/Sao_Paulo'
          }
        );
  };

  const extrairMesAno = (dataIso) => {
    if (!dataIso) {
      return '';
    }

    if (
      typeof dataIso === 'string' &&
      /^\d{4}-\d{2}/.test(dataIso)
    ) {
      return dataIso
        .split('T')[0]
        .substring(0, 7);
    }

    const d =
      new Date(dataIso);

    if (isNaN(d.getTime())) {
      return '';
    }

    const ano =
      d.getFullYear();

    const mes =
      String(
        d.getMonth() + 1
      ).padStart(2, '0');

    return `${ano}-${mes}`;
  };

  const handleInteresse = (pedido) => {
    if (onDemonstrarInteresse) {
      onDemonstrarInteresse(
        pedido
      );
    } else if (onNavigate) {
      onNavigate(
        'chat',
        pedido
      );
    }
  };

  const listaPedidos =
    Array.isArray(pedidos)
      ? pedidos
      : [];

  const pedidosFiltrados =
    listaPedidos.filter((pedido) => {
      const info =
        extrairInformacoes(
          pedido.descricao,
          pedido.localizacao
        );

      const statusAtual =
        pedido.status ||
        pedido.status_pedido;

      const statusAberto =
        statusAtual === 'Aberto' ||
        statusAtual === 'Disponível' ||
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
        filtroServico === 'Todos' ||
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
        mesAnoPedido === filtroPrazo;

      return (
        statusAberto &&
        atendeServico &&
        atendeLocal &&
        atendePrazo
      );
    });

  return (
    <div
      style={{
        width: 'min(1120px, 94%)',
        margin: '38px auto 70px',
        fontFamily:
          "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
        color: '#4A424A'
      }}
    >

      {/* CABEÇALHO */}

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'flex-end',
          gap: '24px',
          marginBottom: '25px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <span
            style={{
              display: 'block',
              marginBottom: '6px',
              color: '#917687',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '1.4px',
              textTransform:
                'uppercase'
            }}
          >
            Área da costureira
          </span>

          <h1
            style={{
              margin: 0,
              color: '#3E2445',
              fontFamily:
                "'Playfair Display', Georgia, serif",
              fontSize: '34px',
              lineHeight: '1.15'
            }}
          >
            Pedidos disponíveis
          </h1>

          {usuarioAtual?.nome && (
            <p
              style={{
                margin: '8px 0 0',
                color: '#857885',
                fontSize: '12px',
                lineHeight: '1.6'
              }}
            >
              Olá,{' '}
              <strong
                style={{
                  color: '#6E5568',
                  fontWeight: '600'
                }}
              >
                {usuarioAtual.nome}
              </strong>
              . Encontre novas solicitações
              compatíveis com seus serviços.
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={() =>
              onNavigate &&
              onNavigate(
                'meusChats'
              )
            }
            style={{
              height: '40px',
              padding: '0 15px',
              background: '#FFFFFF',
              color: '#7A5B72',
              border:
                '1px solid #D8CFD5',
              borderRadius: '8px',
              fontSize: '10px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Minhas conversas
          </button>

          <div
            style={{
              minWidth: '62px',
              padding: '7px 12px',
              background: '#F3ECEF',
              border:
                '1px solid #E4D9E0',
              borderRadius: '9px',
              textAlign: 'center'
            }}
          >
            <span
              style={{
                display: 'block',
                color: '#917687',
                fontSize: '7px',
                fontWeight: '700',
                letterSpacing:
                  '0.8px',
                textTransform:
                  'uppercase'
              }}
            >
              Disponíveis
            </span>

            <strong
              style={{
                display: 'block',
                marginTop: '1px',
                color: '#3E2445',
                fontFamily:
                  "'Playfair Display', Georgia, serif",
                fontSize: '20px'
              }}
            >
              {pedidosFiltrados.length}
            </strong>
          </div>

          <AvatarPerfil
            usuario={usuarioAtual}
            onClick={() =>
              onNavigate &&
              onNavigate(
                'perfil'
              )
            }
          />
        </div>
      </div>


      {/* FILTROS */}

      <section
        style={{
          marginBottom: '25px',
          padding: '20px',
          background: '#FFFFFF',
          border:
            '1px solid #EBE5E0',
          borderRadius: '13px',
          boxShadow:
            '0 7px 20px rgba(62,36,69,0.04)'
        }}
      >
        <div
          style={{
            marginBottom: '16px'
          }}
        >
          <span
            style={{
              display: 'block',
              marginBottom: '3px',
              color: '#917687',
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform:
                'uppercase'
            }}
          >
            Busca
          </span>

          <h2
            style={{
              margin: 0,
              color: '#3E2445',
              fontFamily:
                "'Playfair Display', Georgia, serif",
              fontSize: '18px'
            }}
          >
            Encontrar pedidos
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '15px'
          }}
        >

          {/* TIPO */}

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#625762',
                fontSize: '10px',
                fontWeight: '700'
              }}
            >
              Tipo de serviço
            </label>

            <select
              value={filtroServico}
              onChange={(e) =>
                setFiltroServico(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                height: '40px',
                padding: '0 11px',
                background: '#FAF8F7',
                color: '#4A424A',
                border:
                  '1px solid #DED6D1',
                borderRadius: '8px',
                boxSizing:
                  'border-box',
                outline: 'none',
                fontSize: '11px',
                cursor: 'pointer'
              }}
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

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#625762',
                fontSize: '10px',
                fontWeight: '700'
              }}
            >
              Bairro ou cidade
            </label>

            <input
              type="text"
              placeholder="Ex.: Centro, Ponta Grossa..."
              value={buscaLocalizacao}
              onChange={(e) =>
                setBuscaLocalizacao(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                height: '40px',
                padding: '0 11px',
                background: '#FAF8F7',
                color: '#4A424A',
                border:
                  '1px solid #DED6D1',
                borderRadius: '8px',
                boxSizing:
                  'border-box',
                outline: 'none',
                fontSize: '11px'
              }}
            />
          </div>


          {/* PRAZO */}

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#625762',
                fontSize: '10px',
                fontWeight: '700'
              }}
            >
              Prazo desejado
            </label>

            <div
              style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center'
              }}
            >
              <input
                type="month"
                value={filtroPrazo}
                onChange={(e) =>
                  setFiltroPrazo(
                    e.target.value
                  )
                }
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '40px',
                  padding: '0 11px',
                  background: '#FAF8F7',
                  color: '#4A424A',
                  border:
                    '1px solid #DED6D1',
                  borderRadius: '8px',
                  boxSizing:
                    'border-box',
                  outline: 'none',
                  fontSize: '11px'
                }}
              />

              {filtroPrazo && (
                <button
                  type="button"
                  onClick={() =>
                    setFiltroPrazo('')
                  }
                  title="Limpar filtro de mês/ano"
                  style={{
                    width: '40px',
                    height: '40px',
                    flexShrink: 0,
                    background:
                      '#F3ECEF',
                    color: '#7A5B72',
                    border:
                      '1px solid #D8CFD5',
                    borderRadius:
                      '8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

        </div>
      </section>


      {/* CARREGAMENTO */}

      {carregando && (
        <div
          style={{
            padding: '45px',
            background: '#FFFFFF',
            border:
              '1px solid #EBE5E0',
            borderRadius: '13px',
            textAlign: 'center',
            color: '#857885',
            fontSize: '12px'
          }}
        >
          Carregando pedidos do mural...
        </div>
      )}


      {/* ERRO */}

      {erro && (
        <div
          style={{
            marginBottom: '15px',
            padding: '11px 14px',
            background: '#FFF1F1',
            color: '#A43B3B',
            border:
              '1px solid #F1D5D5',
            borderRadius: '8px',
            fontSize: '11px'
          }}
        >
          {erro}
        </div>
      )}


      {/* LISTA */}

      {!carregando &&
      pedidosFiltrados.length === 0 ? (

        <div
          style={{
            padding: '55px 25px',
            background: '#FFFFFF',
            border:
              '1px dashed #D9CCD5',
            borderRadius: '13px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F3ECEF',
              color: '#7A5B72',
              borderRadius: '50%',
              fontSize: '18px'
            }}
          >
            ✂
          </div>

          <h3
            style={{
              margin: '0 0 6px',
              color: '#3E2445',
              fontFamily:
                "'Playfair Display', Georgia, serif",
              fontSize: '18px'
            }}
          >
            Nenhum pedido encontrado
          </h3>

          <p
            style={{
              maxWidth: '450px',
              margin: '0 auto',
              color: '#91858E',
              fontSize: '11px',
              lineHeight: '1.6'
            }}
          >
            Tente alterar os termos de
            busca ou aguarde novas
            publicações dos clientes.
          </p>
        </div>

      ) : (

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '18px'
          }}
        >
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
                  style={{
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection:
                      'column',
                    background:
                      '#FFFFFF',
                    border:
                      '1px solid #EBE5E0',
                    borderRadius:
                      '13px',
                    boxShadow:
                      '0 7px 20px rgba(62,36,69,0.05)'
                  }}
                >

                  {/* FOTO */}

                  {pedido.fotoReferencia ? (
                    <div
                      style={{
                        width: '100%',
                        height: '190px',
                        overflow: 'hidden',
                        background:
                          '#FAF8F7',
                        borderBottom:
                          '1px solid #EEE7E3'
                      }}
                    >
                      <img
                        src={
                          pedido.fotoReferencia
                        }
                        alt="Referência da peça"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: '95px',
                        display: 'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                        background:
                          '#FAF8F7',
                        color: '#C2B4BD',
                        borderBottom:
                          '1px solid #EEE7E3',
                        fontSize: '24px'
                      }}
                    >
                      ✂
                    </div>
                  )}


                  {/* CONTEÚDO */}

                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection:
                        'column',
                      padding: '20px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        gap: '10px',
                        marginBottom:
                          '12px'
                      }}
                    >
                      <span
                        style={{
                          padding:
                            '5px 9px',
                          background:
                            '#F3ECEF',
                          color:
                            '#6E5568',
                          borderRadius:
                            '999px',
                          fontSize: '8px',
                          fontWeight:
                            '700',
                          letterSpacing:
                            '0.3px',
                          textTransform:
                            'uppercase'
                        }}
                      >
                        {info.tipo}
                      </span>

                      <span
                        style={{
                          color:
                            '#A0949C',
                          fontSize: '9px'
                        }}
                      >
                        {formatarData(
                          pedido.dataPublicacao ||
                          pedido.data_publicacao
                        )}
                      </span>
                    </div>


                    <span
                      style={{
                        display: 'block',
                        marginBottom:
                          '3px',
                        color: '#A0949C',
                        fontSize: '8px',
                        fontWeight: '700',
                        letterSpacing:
                          '0.7px',
                        textTransform:
                          'uppercase'
                      }}
                    >
                      Solicitação de cliente
                    </span>


                    <h3
                      style={{
                        margin:
                          '0 0 10px',
                        color: '#3E2445',
                        fontFamily:
                          "'Playfair Display', Georgia, serif",
                        fontSize: '18px',
                        lineHeight: '1.25'
                      }}
                    >
                      {pedido.clienteNome ||
                        pedido.cliente_nome ||
                        'Cliente'}
                    </h3>


                    <p
                      style={{
                        flex: 1,
                        margin:
                          '0 0 16px',
                        color: '#625962',
                        fontSize: '11px',
                        lineHeight: '1.6',
                        whiteSpace:
                          'pre-line'
                      }}
                    >
                      {info.descricao ||
                        'O cliente não adicionou uma descrição.'}
                    </p>


                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '1fr 1fr',
                        gap: '8px',
                        marginBottom:
                          '16px'
                      }}
                    >

                      {/* LOCAL */}

                      <div
                        style={{
                          padding: '10px',
                          background:
                            '#FAF8F7',
                          borderRadius:
                            '8px'
                        }}
                      >
                        <span
                          style={{
                            display:
                              'block',
                            marginBottom:
                              '3px',
                            color:
                              '#A0949C',
                            fontSize:
                              '8px',
                            fontWeight:
                              '700',
                            textTransform:
                              'uppercase'
                          }}
                        >
                          Localização
                        </span>

                        <strong
                          style={{
                            color:
                              '#554C54',
                            fontSize:
                              '10px',
                            fontWeight:
                              '600',
                            lineHeight:
                              '1.4'
                          }}
                        >
                          {info.localizacao}
                        </strong>
                      </div>


                      {/* PRAZO */}

                      <div
                        style={{
                          padding: '10px',
                          background:
                            '#FAF8F7',
                          borderRadius:
                            '8px'
                        }}
                      >
                        <span
                          style={{
                            display:
                              'block',
                            marginBottom:
                              '3px',
                            color:
                              '#A0949C',
                            fontSize:
                              '8px',
                            fontWeight:
                              '700',
                            textTransform:
                              'uppercase'
                          }}
                        >
                          Prazo
                        </span>

                        <strong
                          style={{
                            color:
                              '#554C54',
                            fontSize:
                              '10px',
                            fontWeight:
                              '600'
                          }}
                        >
                          {formatarData(
                            prazoPedido
                          )}
                        </strong>
                      </div>
                    </div>


                    {/* AÇÃO */}

                    {isCostureira ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleInteresse(
                            pedido
                          )
                        }
                        style={{
                          width: '100%',
                          padding:
                            '10px 14px',
                          background:
                            '#7A5B72',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius:
                            '8px',
                          fontSize: '10px',
                          fontWeight:
                            '700',
                          cursor: 'pointer',
                          boxShadow:
                            '0 5px 14px rgba(62,36,69,0.10)'
                        }}
                      >
                        Demonstrar interesse
                      </button>
                    ) : (
                      <div
                        style={{
                          padding: '9px',
                          background:
                            '#FAF8F7',
                          color:
                            '#91858E',
                          borderRadius:
                            '7px',
                          fontSize: '9px',
                          fontStyle:
                            'italic',
                          textAlign:
                            'center'
                        }}
                      >
                        Apenas contas de
                        Costureira podem aceitar
                        solicitações.
                      </div>
                    )}

                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

export default FeedPedidos;