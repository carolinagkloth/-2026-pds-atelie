import React, { useEffect, useState } from 'react';


function MeusChats({
  usuario,
  onNavigate
}) {

  const usuarioSalvo = (() => {
    try {
      const item =
        localStorage.getItem('usuarioAtelie');

      return item && item !== 'undefined'
        ? JSON.parse(item)
        : {};
    } catch {
      return {};
    }
  })();


  const usuarioAtual =
    usuario &&
    Object.keys(usuario).length > 0
      ? usuario
      : usuarioSalvo;


  const idUsuario =
    usuarioAtual?.id_usuario ||
    usuarioAtual?.id;


  const isCostureira =
    (
      usuarioAtual?.tipo_usuario ||
      usuarioAtual?.tipoUsuario ||
      ''
    )
      .toString()
      .toLowerCase() === 'costureira';


  const [conversas, setConversas] =
    useState([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  const [filtroStatus, setFiltroStatus] =
    useState('Todos');


  /* ========================================
     BACKEND ATUAL DA CAROLINA
  ======================================== */

  useEffect(() => {

    if (idUsuario) {
      carregarConversas();
    }

  }, [idUsuario]);


  const carregarConversas = () => {

    setCarregando(true);


    fetch(
      `/api/conversas/usuario/${idUsuario}`
    )

      .then((res) => {

        if (!res.ok) {
          throw new Error(
            'Erro ao carregar a lista de conversas.'
          );
        }

        return res.json();

      })

      .then((data) => {

        setConversas(
          Array.isArray(data)
            ? data
            : []
        );

      })

      .catch((err) =>
        setErro(err.message)
      )

      .finally(() =>
        setCarregando(false)
      );

  };


  const extrairDescricaoLimpa = (
    texto
  ) => {

    if (!texto) {
      return '';
    }


    if (
      texto.includes('Localização:')
    ) {

      const partes =
        texto.split(
          'Localização:'
        );


      const resto =
        partes[1]?.trim() || '';


      const quebra =
        resto.indexOf('\n\n');


      if (quebra !== -1) {

        return resto
          .substring(quebra)
          .trim();

      }


      const primeiraLinha =
        resto.split('\n')[0];


      return resto
        .substring(
          primeiraLinha.length
        )
        .trim();

    }


    return texto;

  };


  const conversasFiltradas =
    conversas.filter(
      (item) => {

        const status =
          item.status ||
          'Aberto';


        if (
          filtroStatus === 'Todos'
        ) {
          return true;
        }


        return (
          status.toLowerCase() ===
          filtroStatus.toLowerCase()
        );

      }
    );


  const handleVoltar = () => {

    if (!onNavigate) {
      return;
    }


    onNavigate(
      isCostureira
        ? 'feedPedidos'
        : 'meusPedidos'
    );

  };


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


      {/* CABEÇALHO IGUAL AO MODELO ANTIGO */}

      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '25px',
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
              textTransform: 'uppercase'
            }}
          >
            Mensagens
          </span>


          <h1
            style={{
              margin: 0,

              color: '#3E2445',

              fontFamily:
                "'Playfair Display', Georgia, serif",

              fontSize: '34px'
            }}
          >
            Conversas em andamento
          </h1>


          <p
            style={{
              maxWidth: '620px',

              margin: '8px 0 0',

              color: '#857885',

              fontSize: '13px',

              lineHeight: '1.6'
            }}
          >
            Acompanhe suas conversas e continue
            as negociações iniciadas com clientes
            e costureiras.
          </p>

        </div>


        <button
          type="button"
          onClick={handleVoltar}
          style={{
            padding: '9px 15px',

            background: '#FFFFFF',

            color: '#7A5B72',

            border:
              '1px solid #D8CFD5',

            borderRadius: '8px',

            fontSize: '11px',

            fontWeight: '700',

            cursor: 'pointer'
          }}
        >
          ← Voltar aos pedidos
        </button>

      </section>


      {/* CAIXA PRINCIPAL */}

      <section
        style={{
          overflow: 'hidden',

          background: '#FFFFFF',

          border:
            '1px solid #EBE5E0',

          borderRadius: '15px',

          boxShadow:
            '0 10px 28px rgba(62,36,69,0.06)'
        }}
      >


        {/* TOPO */}

        <div
          style={{
            display: 'flex',

            justifyContent:
              'space-between',

            alignItems:
              'center',

            gap: '20px',

            padding:
              '17px 20px',

            borderBottom:
              '1px solid #F0EAE7',

            flexWrap:
              'wrap'
          }}
        >


          <div
            style={{
              display: 'flex',

              alignItems:
                'center',

              gap: '12px'
            }}
          >

            <div
              style={{
                width: '40px',
                height: '40px',

                display: 'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                borderRadius:
                  '50%',

                background:
                  '#F3ECEF',

                color:
                  '#7A5B72',

                fontFamily:
                  "'Playfair Display', Georgia, serif",

                fontSize:
                  '17px',

                fontWeight:
                  '700'
              }}
            >
              {
                usuarioAtual?.nome
                  ?.charAt(0)
                  .toUpperCase() ||
                'U'
              }
            </div>


            <div>

              <span
                style={{
                  color: '#A0949C',

                  fontSize: '9px',

                  fontWeight:
                    '700',

                  textTransform:
                    'uppercase',

                  letterSpacing:
                    '0.8px'
                }}
              >
                Caixa de mensagens
              </span>


              <h2
                style={{
                  margin:
                    '2px 0',

                  color:
                    '#3E2445',

                  fontFamily:
                    "'Playfair Display', Georgia, serif",

                  fontSize:
                    '17px'
                }}
              >
                {
                  usuarioAtual?.nome ||
                  'Usuário'
                }
              </h2>


              <p
                style={{
                  margin: 0,

                  color:
                    '#91858E',

                  fontSize:
                    '10px'
                }}
              >
                {
                  conversas.length
                } conversa{
                  conversas.length === 1
                    ? ''
                    : 's'
                }
              </p>

            </div>

          </div>


          {/* FILTRO */}

          <div
            style={{
              display: 'flex',

              alignItems:
                'center',

              gap: '8px'
            }}
          >

            <span
              style={{
                color:
                  '#91858E',

                fontSize:
                  '9px',

                fontWeight:
                  '700'
              }}
            >
              Status
            </span>


            <select
              value={filtroStatus}
              onChange={
                (e) =>
                  setFiltroStatus(
                    e.target.value
                  )
              }
              style={{
                padding:
                  '8px 11px',

                background:
                  '#FAF8F7',

                color:
                  '#554C54',

                border:
                  '1px solid #DED6D1',

                borderRadius:
                  '8px',

                outline:
                  'none',

                fontSize:
                  '10px'
              }}
            >

              <option value="Todos">
                Todos
              </option>

              <option value="Aberto">
                Aberto / Em negociação
              </option>

              <option value="Em Produção">
                Em produção
              </option>

              <option value="Aguardando Prova">
                Aguardando prova
              </option>

              <option value="Concluído">
                Concluído
              </option>

            </select>

          </div>

        </div>


        {/* FUNDO DE MENSAGENS */}

        <div
          style={{
            minHeight: '470px',

            padding: '22px',

            background: '#FAF7F5'
          }}
        >


          {carregando && (

            <div
              style={{
                minHeight: '400px',

                display: 'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                color:
                  '#91858E',

                fontSize:
                  '11px'
              }}
            >
              Carregando conversas...
            </div>

          )}


          {erro && (

            <div
              style={{
                padding:
                  '11px 14px',

                background:
                  '#FFF1F1',

                color:
                  '#A43B3B',

                border:
                  '1px solid #F1D5D5',

                borderRadius:
                  '8px',

                fontSize:
                  '11px'
              }}
            >
              {erro}
            </div>

          )}


          {!carregando &&
           conversasFiltradas.length === 0 && (

            <div
              style={{
                minHeight: '400px',

                display: 'flex',

                flexDirection:
                  'column',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                textAlign:
                  'center'
              }}
            >

              <div
                style={{
                  width: '45px',
                  height: '45px',

                  display: 'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  marginBottom:
                    '12px',

                  background:
                    '#F3ECEF',

                  color:
                    '#7A5B72',

                  borderRadius:
                    '50%',

                  fontSize:
                    '18px'
                }}
              >
                ✉
              </div>


              <h3
                style={{
                  margin:
                    '0 0 5px',

                  color:
                    '#3E2445',

                  fontFamily:
                    "'Playfair Display', Georgia, serif",

                  fontSize:
                    '17px'
                }}
              >
                Nenhuma conversa ainda
              </h3>


              <p
                style={{
                  maxWidth:
                    '350px',

                  margin: 0,

                  color:
                    '#91858E',

                  fontSize:
                    '11px',

                  lineHeight:
                    '1.5'
                }}
              >
                Quando uma negociação for iniciada,
                ela aparecerá aqui.
              </p>

            </div>

          )}


          {/* CONVERSAS */}

          {!carregando &&
           conversasFiltradas.length > 0 && (

            <div
              style={{
                display: 'flex',

                flexDirection:
                  'column',

                gap: '11px'
              }}
            >

              {conversasFiltradas.map(
                (item) => {

                  const nomeOutraPessoa =
                    isCostureira
                      ? item.clienteNome
                      : (
                          item.costureiraNome ||
                          'Ateliê'
                        );


                  const inicial =
                    (
                      nomeOutraPessoa ||
                      'C'
                    )
                      .charAt(0)
                      .toUpperCase();


                  const descricao =
                    extrairDescricaoLimpa(
                      item.descricao
                    ) ||
                    'Serviço';


                  const data =
                    item.dataUltimaAtividade
                      ? new Date(
                          item.dataUltimaAtividade
                        )
                          .toLocaleString(
                            'pt-BR',
                            {
                              dateStyle:
                                'short',

                              timeStyle:
                                'short'
                            }
                          )
                      : '';


                  return (

                    <div
                      key={
                        item.idPedido
                      }

                      onClick={() =>
                        onNavigate &&
                        onNavigate(
                          'chat',
                          item
                        )
                      }

                      style={{
                        display: 'grid',

                        gridTemplateColumns:
                          'auto minmax(0,1fr) auto',

                        alignItems:
                          'center',

                        gap: '14px',

                        padding:
                          '15px 16px',

                        background:
                          '#FFFFFF',

                        border:
                          '1px solid #E9E1DD',

                        borderRadius:
                          '12px',

                        boxShadow:
                          '0 4px 10px rgba(62,36,69,0.04)',

                        cursor:
                          'pointer'
                      }}
                    >


                      {/* AVATAR */}

                      <div
                        style={{
                          width: '43px',
                          height: '43px',

                          display:
                            'flex',

                          alignItems:
                            'center',

                          justifyContent:
                            'center',

                          background:
                            '#F3ECEF',

                          color:
                            '#7A5B72',

                          borderRadius:
                            '50%',

                          fontFamily:
                            "'Playfair Display', Georgia, serif",

                          fontSize:
                            '17px',

                          fontWeight:
                            '700'
                        }}
                      >
                        {inicial}
                      </div>


                      {/* TEXTO */}

                      <div
                        style={{
                          minWidth: 0
                        }}
                      >

                        <div
                          style={{
                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap: '8px',

                            marginBottom:
                              '4px'
                          }}
                        >

                          <h3
                            style={{
                              margin: 0,

                              color:
                                '#3E2445',

                              fontFamily:
                                "'Playfair Display', Georgia, serif",

                              fontSize:
                                '16px'
                            }}
                          >
                            {
                              nomeOutraPessoa ||
                              'Contato'
                            }
                          </h3>


                          <span
                            style={{
                              padding:
                                '4px 8px',

                              background:
                                '#F3ECEF',

                              color:
                                '#6E5568',

                              borderRadius:
                                '999px',

                              fontSize:
                                '8px',

                              fontWeight:
                                '700',

                              textTransform:
                                'uppercase'
                            }}
                          >
                            {
                              item.status ||
                              'Aberto'
                            }
                          </span>

                        </div>


                        <span
                          style={{
                            display:
                              'block',

                            marginBottom:
                              '5px',

                            color:
                              '#625962',

                            fontSize:
                              '10px',

                            fontWeight:
                              '600',

                            whiteSpace:
                              'nowrap',

                            overflow:
                              'hidden',

                            textOverflow:
                              'ellipsis'
                          }}
                        >
                          {descricao}
                        </span>


                        <p
                          style={{
                            margin: 0,

                            color:
                              '#91858E',

                            fontSize:
                              '10px',

                            whiteSpace:
                              'nowrap',

                            overflow:
                              'hidden',

                            textOverflow:
                              'ellipsis'
                          }}
                        >
                          {
                            item.ultimaMensagem ||
                            'Nenhuma mensagem trocada ainda.'
                          }
                        </p>

                      </div>


                      {/* DIREITA */}

                      <div
                        style={{
                          display:
                            'flex',

                          flexDirection:
                            'column',

                          alignItems:
                            'flex-end',

                          gap:
                            '8px'
                        }}
                      >

                        <span
                          style={{
                            color:
                              '#A0949C',

                            fontSize:
                              '9px'
                          }}
                        >
                          {data}
                        </span>


                        <span
                          style={{
                            padding:
                              '8px 12px',

                            background:
                              '#7A5B72',

                            color:
                              '#FFFFFF',

                            borderRadius:
                              '7px',

                            fontSize:
                              '9px',

                            fontWeight:
                              '700'
                          }}
                        >
                          Abrir conversa
                        </span>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </div>

      </section>

    </div>

  );

}


export default MeusChats;