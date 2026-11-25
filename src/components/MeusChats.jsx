import React, { useState, useEffect } from 'react';
import AvatarPerfil from './AvatarPerfil';


const obterEstiloStatus = (status) => {
  const s = (status || '').toLowerCase();

  if (s === 'aberto' || s === 'disponível') {
    return {
      background: '#EEF5EE',
      border: '1px solid #D7E6D7',
      color: '#557255'
    };
  }

  if (s === 'aguardando prova') {
    return {
      background: '#FFF7EA',
      border: '1px solid #F0DFC0',
      color: '#9A7040'
    };
  }

  if (s === 'em produção' || s === 'a fazer') {
    return {
      background: '#EEF2F7',
      border: '1px solid #D8E0EA',
      color: '#5C6F85'
    };
  }

  if (s === 'concluído') {
    return {
      background: '#EDF6F3',
      border: '1px solid #D4E8E2',
      color: '#52766B'
    };
  }

  if (s === 'entregue') {
    return {
      background: '#F3ECEF',
      border: '1px solid #E1D4DC',
      color: '#7A5B72'
    };
  }

  if (s === 'cancelado') {
    return {
      background: '#FFF0F0',
      border: '1px solid #F0D6D6',
      color: '#9B5D5D'
    };
  }

  return {
    background: '#F4F1F2',
    border: '1px solid #E2DBDE',
    color: '#746A70'
  };
};


function MeusChats({
  usuario,
  onNavigate
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
     LÓGICA DA CAROLINA
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

        if (Array.isArray(data)) {
          setConversas(data);
        } else {
          setConversas([]);
        }

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
      texto.includes(
        'Localização:'
      )
    ) {

      const partes =
        texto.split(
          'Localização:'
        );


      const resto =
        partes[1].trim();


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

        const statusItem =
          item.status ||
          'Aberto';


        if (
          filtroStatus === 'Todos'
        ) {
          return true;
        }


        return (
          statusItem.toLowerCase() ===
          filtroStatus.toLowerCase()
        );

      }
    );


  /* ========================================
     VISUAL
  ======================================== */

  return (

    <div
      style={{
        width: 'min(1120px, 94%)',

        margin:
          '38px auto 70px',

        fontFamily:
          "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

        color:
          '#4A424A'
      }}
    >


      {/* CABEÇALHO */}

      <section
        style={{
          display: 'flex',

          justifyContent:
            'space-between',

          alignItems:
            'flex-end',

          gap:
            '24px',

          marginBottom:
            '25px',

          flexWrap:
            'wrap'
        }}
      >


        <div>

          <span
            style={{
              display:
                'block',

              marginBottom:
                '6px',

              color:
                '#917687',

              fontSize:
                '10px',

              fontWeight:
                '700',

              letterSpacing:
                '1.4px',

              textTransform:
                'uppercase'
            }}
          >
            Mensagens
          </span>


          <h1
            style={{
              margin:
                0,

              color:
                '#3E2445',

              fontFamily:
                "'Playfair Display', Georgia, serif",

              fontSize:
                '34px',

              lineHeight:
                '1.15'
            }}
          >
            Conversas em andamento
          </h1>


          <p
            style={{
              maxWidth:
                '620px',

              margin:
                '8px 0 0',

              color:
                '#857885',

              fontSize:
                '13px',

              lineHeight:
                '1.6'
            }}
          >
            Acompanhe suas conversas e
            continue suas negociações,
            provas e pedidos em andamento.
          </p>

        </div>


        <div
          style={{
            display:
              'flex',

            alignItems:
              'center',

            gap:
              '10px'
          }}
        >

          <button
            type="button"

            onClick={() =>
              onNavigate &&
              onNavigate(
                isCostureira
                  ? 'feedPedidos'
                  : 'areaCliente'
              )
            }

            style={{
              height:
                '40px',

              padding:
                '0 15px',

              background:
                '#FFFFFF',

              color:
                '#7A5B72',

              border:
                '1px solid #D8CFD5',

              borderRadius:
                '8px',

              fontSize:
                '10px',

              fontWeight:
                '700',

              cursor:
                'pointer'
            }}
          >
            ← {isCostureira
              ? 'Voltar aos pedidos'
              : 'Área do cliente'}
          </button>


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

      </section>


      {/* CAIXA PRINCIPAL */}

      <section
        style={{
          overflow:
            'hidden',

          background:
            '#FFFFFF',

          border:
            '1px solid #EBE5E0',

          borderRadius:
            '15px',

          boxShadow:
            '0 10px 28px rgba(62,36,69,0.06)'
        }}
      >


        {/* TOPO DA CAIXA */}

        <div
          style={{
            display:
              'flex',

            justifyContent:
              'space-between',

            alignItems:
              'center',

            gap:
              '20px',

            padding:
              '18px 20px',

            borderBottom:
              '1px solid #F0EAE7',

            flexWrap:
              'wrap'
          }}
        >


          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                '12px'
            }}
          >

            <div
              style={{
                width:
                  '42px',

                height:
                  '42px',

                display:
                  'flex',

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
                  display:
                    'block',

                  color:
                    '#A0949C',

                  fontSize:
                    '8px',

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
                  margin:
                    0,

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
              display:
                'flex',

              alignItems:
                'center',

              gap:
                '8px'
            }}
          >

            <label
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
            </label>


            <select
              value={
                filtroStatus
              }

              onChange={(e) =>
                setFiltroStatus(
                  e.target.value
                )
              }

              style={{
                minWidth:
                  '180px',

                height:
                  '38px',

                padding:
                  '0 11px',

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
                Todos os status
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

              <option value="Entregue">
                Entregue
              </option>

              <option value="Cancelado">
                Cancelado
              </option>

            </select>

          </div>

        </div>


        {/* ÁREA DAS CONVERSAS */}

        <div
          style={{
            minHeight:
              '470px',

            padding:
              '22px',

            background:
              '#FAF7F5'
          }}
        >


          {/* CARREGAMENTO */}

          {carregando && (

            <div
              style={{
                minHeight:
                  '400px',

                display:
                  'flex',

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


          {/* ERRO */}

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


          {/* SEM CONVERSAS */}

          {!carregando &&
           conversasFiltradas.length === 0 && (

            <div
              style={{
                minHeight:
                  '400px',

                display:
                  'flex',

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
                  width:
                    '45px',

                  height:
                    '45px',

                  display:
                    'flex',

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
                Nenhuma conversa encontrada
              </h3>


              <p
                style={{
                  maxWidth:
                    '350px',

                  margin:
                    0,

                  color:
                    '#91858E',

                  fontSize:
                    '11px',

                  lineHeight:
                    '1.5'
                }}
              >
                Não há conversas para o
                filtro selecionado.
              </p>

            </div>

          )}


          {/* CONVERSAS */}

          {!carregando &&
           conversasFiltradas.length > 0 && (

            <div
              style={{
                display:
                  'flex',

                flexDirection:
                  'column',

                gap:
                  '11px'
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


                  const dataFormatada =
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
                      : '-';


                  const statusAtual =
                    item.status ||
                    'Aberto';


                  const estiloStatus =
                    obterEstiloStatus(
                      statusAtual
                    );


                  const naoLidas =
                    Number(
                      item.naoLidas ||
                      0
                    );


                  const temNaoLidas =
                    naoLidas > 0;


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
                        display:
                          'grid',

                        gridTemplateColumns:
                          'auto minmax(0, 1fr) auto',

                        alignItems:
                          'center',

                        gap:
                          '14px',

                        padding:
                          '15px 16px',

                        background:
                          temNaoLidas
                            ? '#FDF9FB'
                            : '#FFFFFF',

                        border:
                          '1px solid #E9E1DD',

                        borderLeft:
                          temNaoLidas
                            ? '4px solid #917687'
                            : '1px solid #E9E1DD',

                        borderRadius:
                          '12px',

                        boxShadow:
                          '0 4px 10px rgba(62,36,69,0.04)',

                        cursor:
                          'pointer',

                        transition:
                          'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease'
                      }}

                      onMouseEnter={(e) => {

                        e.currentTarget.style.transform =
                          'translateY(-1px)';

                        e.currentTarget.style.boxShadow =
                          '0 7px 18px rgba(62,36,69,0.08)';

                        e.currentTarget.style.borderTopColor =
                          '#D8CFD5';

                        e.currentTarget.style.borderRightColor =
                          '#D8CFD5';

                        e.currentTarget.style.borderBottomColor =
                          '#D8CFD5';

                      }}

                      onMouseLeave={(e) => {

                        e.currentTarget.style.transform =
                          'translateY(0)';

                        e.currentTarget.style.boxShadow =
                          '0 4px 10px rgba(62,36,69,0.04)';

                        e.currentTarget.style.borderTopColor =
                          '#E9E1DD';

                        e.currentTarget.style.borderRightColor =
                          '#E9E1DD';

                        e.currentTarget.style.borderBottomColor =
                          '#E9E1DD';

                      }}
                    >


                      {/* AVATAR */}

                      <div
                        style={{
                          width:
                            '43px',

                          height:
                            '43px',

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

                          border:
                            '1px solid #E4D9E0',

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
                          minWidth:
                            0
                        }}
                      >

                        <div
                          style={{
                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap:
                              '8px',

                            marginBottom:
                              '4px',

                            flexWrap:
                              'wrap'
                          }}
                        >

                          <h3
                            style={{
                              margin:
                                0,

                              color:
                                '#3E2445',

                              fontFamily:
                                "'Playfair Display', Georgia, serif",

                              fontSize:
                                '16px',

                              fontWeight:
                                '700'
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
                                estiloStatus.background,

                              color:
                                estiloStatus.color,

                              border:
                                estiloStatus.border,

                              borderRadius:
                                '999px',

                              fontSize:
                                '8px',

                              fontWeight:
                                '700',

                              textTransform:
                                'uppercase',

                              letterSpacing:
                                '0.2px'
                            }}
                          >
                            {
                              statusAtual
                            }
                          </span>


                          {temNaoLidas && (

                            <span
                              style={{
                                color:
                                  '#917687',

                                fontSize:
                                  '8px',

                                fontWeight:
                                  '700',

                                letterSpacing:
                                  '0.5px',

                                textTransform:
                                  'uppercase'
                              }}
                            >
                              Nova mensagem
                            </span>

                          )}

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
                            margin:
                              0,

                            color:
                              temNaoLidas
                                ? '#6E5568'
                                : '#91858E',

                            fontSize:
                              '10px',

                            fontWeight:
                              temNaoLidas
                                ? '600'
                                : '400',

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

                          justifyContent:
                            'center',

                          gap:
                            '8px',

                          flexShrink:
                            0
                        }}
                      >

                        <span
                          style={{
                            color:
                              temNaoLidas
                                ? '#7A5B72'
                                : '#A0949C',

                            fontSize:
                              '9px',

                            fontWeight:
                              temNaoLidas
                                ? '700'
                                : '400'
                          }}
                        >
                          {dataFormatada}
                        </span>


                        <div
                          style={{
                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap:
                              '7px'
                          }}
                        >

                          {temNaoLidas && (

                            <span
                              title={`${naoLidas} ${
                                naoLidas === 1
                                  ? 'mensagem não lida'
                                  : 'mensagens não lidas'
                              }`}

                              style={{
                                minWidth:
                                  '22px',

                                height:
                                  '22px',

                                padding:
                                  '0 6px',

                                boxSizing:
                                  'border-box',

                                display:
                                  'inline-flex',

                                alignItems:
                                  'center',

                                justifyContent:
                                  'center',

                                background:
                                  '#917687',

                                color:
                                  '#FFFFFF',

                                borderRadius:
                                  '999px',

                                fontSize:
                                  '9px',

                                fontWeight:
                                  '700'
                              }}
                            >
                              {naoLidas}
                            </span>

                          )}


                          <span
                            style={{
                              padding:
                                '7px 10px',

                              background:
                                '#7A5B72',

                              color:
                                '#FFFFFF',

                              borderRadius:
                                '7px',

                              fontSize:
                                '8px',

                              fontWeight:
                                '700',

                              whiteSpace:
                                'nowrap'
                            }}
                          >
                            Abrir conversa
                          </span>

                        </div>

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