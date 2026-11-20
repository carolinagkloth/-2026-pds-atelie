import React, { useState, useRef, useEffect } from 'react';


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
    background: '#F5F2F3',
    border: '1px solid #E2DBDE',
    color: '#746A70'
  };
};


function ChatMessageList({
  mensagens,
  idUsuario,
  idPedido,
  tituloChat,
  statusPedido,
  isCostureira,
  onEnviarMensagem,
  onAceitarProposta,
  onRecusarProposta,
  onAceitarProva,
  onRecusarProva
}) {

  const [novaMensagem, setNovaMensagem] =
    useState('');

  const chatBottomRef =
    useRef(null);


  useEffect(() => {

    chatBottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    });

  }, [mensagens]);


  const handleSubmit = (e) => {

    e.preventDefault();

    if (!novaMensagem.trim()) return;

    onEnviarMensagem(
      novaMensagem.trim()
    );

    setNovaMensagem('');

  };


  const formatarDataHeader = (dataStr) => {

    if (!dataStr) return '';

    const d = new Date(dataStr);

    const hoje = new Date();

    const ontem = new Date(hoje);

    ontem.setDate(
      hoje.getDate() - 1
    );


    if (
      d.toDateString() ===
      hoje.toDateString()
    ) {
      return 'Hoje';
    }


    if (
      d.toDateString() ===
      ontem.toDateString()
    ) {
      return 'Ontem';
    }


    return d.toLocaleDateString(
      'pt-BR'
    );

  };


  const formatarHoraMsg = (dataStr) => {

    if (!dataStr) return '';

    const d =
      new Date(dataStr);


    return isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString(
          'pt-BR',
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        );

  };


  let ultimaDataHeader = null;


  const contratoAtivo =
    [
      'Em Produção',
      'Aguardando Prova',
      'Concluído',
      'Entregue'
    ].includes(statusPedido);


  const pedidoCancelado =
    statusPedido === 'Cancelado';


  const pedidoEncerrado =
    [
      'Cancelado',
      'Entregue'
    ].includes(statusPedido);


  const estiloStatus =
    obterEstiloStatus(
      statusPedido
    );


  const temPropostaPendente =
    !contratoAtivo &&
    !pedidoCancelado &&
    mensagens.some((m) => {

      const ehProp =
        m.tipo_mensagem === 'proposta' ||
        (
          m.conteudo &&
          m.conteudo.includes(
            'Proposta de Orçamento:'
          )
        );


      if (!ehProp) return false;


      let dados =
        m.dados_proposta ||
        {};


      if (
        typeof dados === 'string'
      ) {

        try {

          dados =
            JSON.parse(dados);

        } catch {

          dados = {};

        }

      }


      return (
        dados.status ||
        'pendente'
      ) !== 'recusada';

    });


  const temProvaPendente =
    !pedidoEncerrado &&
    mensagens.some((m) => {

      const ehProva =
        m.tipo_mensagem ===
          'proposta_prova' ||
        (
          m.conteudo &&
          m.conteudo.includes(
            'Proposta de Agendamento de Prova:'
          )
        );


      if (!ehProva) return false;


      let dados =
        m.dados_proposta ||
        {};


      if (
        typeof dados === 'string'
      ) {

        try {

          dados =
            JSON.parse(dados);

        } catch {

          dados = {};

        }

      }


      return (
        dados.status ||
        'pendente'
      ) === 'pendente';

    });


  return (

    <section
      style={{
        height: '620px',

        display: 'flex',

        flexDirection: 'column',

        overflow: 'hidden',

        background: '#FFFFFF',

        border: '1px solid #EBE5E0',

        borderRadius: '14px',

        boxShadow:
          '0 8px 22px rgba(62,36,69,0.05)'
      }}
    >


      {/* =====================================
          CABEÇALHO
      ====================================== */}

      <div
        style={{
          minHeight: '62px',

          padding: '13px 18px',

          boxSizing: 'border-box',

          display: 'flex',

          justifyContent: 'space-between',

          alignItems: 'center',

          gap: '14px',

          background: '#7A5B72',

          color: '#FFFFFF',

          borderBottom:
            '1px solid rgba(255,255,255,0.10)'
        }}
      >

        <div
          style={{
            minWidth: 0,
            flex: 1
          }}
        >

          <span
            style={{
              display: 'block',

              marginBottom: '2px',

              color: '#EEDFE8',

              fontSize: '8px',

              fontWeight: '600',

              letterSpacing: '0.8px',

              textTransform: 'uppercase'
            }}
          >
            Conversa do pedido
          </span>


          <h3
            style={{
              margin: 0,

              overflow: 'hidden',

              color: '#FFFFFF',

              fontFamily:
                "'Playfair Display SC', 'Playfair Display', Georgia, serif",

              fontSize: '15px',

              fontWeight: '700',

              textOverflow: 'ellipsis',

              whiteSpace: 'nowrap'
            }}
          >
            {tituloChat ||
             `Pedido #${idPedido}`}
          </h3>

        </div>


        <div
          style={{
            display: 'flex',

            alignItems: 'center',

            justifyContent: 'flex-end',

            gap: '8px',

            flexShrink: 0,

            flexWrap: 'wrap'
          }}
        >

          {statusPedido && (

            <span
              style={{
                padding: '5px 9px',

                background:
                  estiloStatus.background,

                color:
                  estiloStatus.color,

                border:
                  estiloStatus.border,

                borderRadius: '999px',

                fontSize: '8px',

                fontWeight: '700',

                letterSpacing: '0.2px',

                textTransform: 'uppercase'
              }}
            >
              Status: {statusPedido}
            </span>

          )}


          <span
            style={{
              color: '#EADCEB',

              fontSize: '9px',

              whiteSpace: 'nowrap'
            }}
          >
            Pedido #{idPedido}
          </span>

        </div>

      </div>


      {/* =====================================
          MENSAGENS
      ====================================== */}

      <div
        style={{
          flex: 1,

          padding: '20px 18px',

          overflowY: 'auto',

          background: '#FAF8F7',

          display: 'flex',

          flexDirection: 'column',

          gap: '10px'
        }}
      >

        {mensagens.map(
          (msg, index) => {

            const rawData =
              msg.data_hora_envio ||
              msg.dataHoraEnvio;


            const dataHeader =
              formatarDataHeader(
                rawData
              );


            const exibirDivisor =
              dataHeader &&
              dataHeader !==
                ultimaDataHeader;


            if (exibirDivisor) {
              ultimaDataHeader =
                dataHeader;
            }


            const ehMinha =
              Number(
                msg.id_remetente ||
                msg.idRemetente
              ) ===
              Number(idUsuario);


            const ehProposta =
              msg.tipo_mensagem ===
                'proposta' ||
              (
                msg.conteudo &&
                msg.conteudo.includes(
                  'Proposta de Orçamento:'
                )
              );


            const ehPropostaProva =
              msg.tipo_mensagem ===
                'proposta_prova' ||
              (
                msg.conteudo &&
                msg.conteudo.includes(
                  'Proposta de Agendamento de Prova:'
                )
              );


            let dadosProposta =
              msg.dados_proposta ||
              {};


            if (
              typeof dadosProposta ===
              'string'
            ) {

              try {

                dadosProposta =
                  JSON.parse(
                    dadosProposta
                  );

              } catch {

                dadosProposta = {};

              }

            }


            const statusCard =
              dadosProposta.status ||
              'pendente';


            return (

              <React.Fragment
                key={
                  msg.id_mensagem ||
                  msg.id ||
                  index
                }
              >


                {/* DIVISOR DE DATA */}

                {exibirDivisor && (

                  <div
                    style={{
                      margin: '12px 0',

                      textAlign: 'center'
                    }}
                  >

                    <span
                      style={{
                        display: 'inline-block',

                        padding: '4px 11px',

                        background: '#F0E7EC',

                        color: '#7A5B72',

                        border:
                          '1px solid #E2D5DD',

                        borderRadius: '999px',

                        fontSize: '8px',

                        fontWeight: '600'
                      }}
                    >
                      {dataHeader}
                    </span>

                  </div>

                )}


                {/* BOLHA */}

                <div
                  style={{
                    display: 'flex',

                    justifyContent:
                      ehMinha
                        ? 'flex-end'
                        : 'flex-start'
                  }}
                >

                  <div
                    style={{
                      width: 'fit-content',

                      maxWidth: '78%',

                      padding: '11px 13px',

                      background:
                        ehMinha
                          ? '#7A5B72'
                          : '#FFFFFF',

                      color:
                        ehMinha
                          ? '#FFFFFF'
                          : '#4F474D',

                      border:
                        ehMinha
                          ? '1px solid #7A5B72'
                          : '1px solid #E7DFE3',

                      borderRadius:
                        ehMinha
                          ? '13px 13px 3px 13px'
                          : '13px 13px 13px 3px',

                      boxShadow:
                        ehMinha
                          ? '0 4px 12px rgba(62,36,69,0.08)'
                          : '0 4px 12px rgba(62,36,69,0.035)'
                    }}
                  >


                    {/* NOME */}

                    <div
                      style={{
                        marginBottom: '4px',

                        color:
                          ehMinha
                            ? '#EEDFE8'
                            : '#8B7A86',

                        fontSize: '8px',

                        fontWeight: '700'
                      }}
                    >
                      {msg.remetente_nome ||
                       msg.nomeRemetente ||
                       (
                         ehMinha
                           ? 'Você'
                           : 'Interlocutor'
                       )}
                    </div>


                    {/* TEXTO */}

                    <div
                      style={{
                        paddingBottom: '5px',

                        color:
                          ehMinha
                            ? '#FFFFFF'
                            : '#4F474D',

                        fontSize: '11px',

                        lineHeight: '1.65',

                        whiteSpace: 'pre-line'
                      }}
                    >
                      {msg.conteudo}
                    </div>


                    {/* =================================
                        PROPOSTA DE ORÇAMENTO
                    ================================== */}

                    {ehProposta && (

                      <div
                        style={{
                          marginTop: '9px',

                          padding: '10px',

                          background:
                            ehMinha
                              ? 'rgba(255,255,255,0.09)'
                              : '#FAF8F7',

                          border:
                            ehMinha
                              ? '1px solid rgba(255,255,255,0.16)'
                              : '1px solid #E6DDE2',

                          borderRadius: '8px'
                        }}
                      >


                        {statusCard ===
                        'recusada' ? (

                          <div
                            style={{
                              padding: '8px',

                              background: '#FFF0F0',

                              color: '#9B5D5D',

                              border:
                                '1px solid #F0D6D6',

                              borderRadius: '6px',

                              fontSize: '9px',

                              fontWeight: '700',

                              textAlign: 'center'
                            }}
                          >
                            ✕ Orçamento Recusado
                          </div>

                        ) : contratoAtivo ? (

                          <div
                            style={{
                              padding: '8px',

                              background: '#EEF5EE',

                              color: '#557255',

                              border:
                                '1px solid #D7E6D7',

                              borderRadius: '6px',

                              fontSize: '9px',

                              fontWeight: '700',

                              textAlign: 'center'
                            }}
                          >
                            ✓ Orçamento Aprovado (Contrato Ativo)
                          </div>

                        ) : pedidoCancelado ? (

                          <div
                            style={{
                              padding: '8px',

                              background: '#F4F1F2',

                              color: '#746A70',

                              border:
                                '1px solid #E2DBDE',

                              borderRadius: '6px',

                              fontSize: '9px',

                              fontWeight: '700',

                              textAlign: 'center'
                            }}
                          >
                            Pedido Cancelado (Proposta Encerrada)
                          </div>

                        ) : !isCostureira ? (

                          <div
                            style={{
                              display: 'flex',

                              gap: '7px',

                              marginTop: '5px',

                              flexWrap: 'wrap'
                            }}
                          >

                            <button
                              type="button"

                              onClick={() =>
                                onAceitarProposta(
                                  dadosProposta,
                                  msg.id_remetente ||
                                  msg.idRemetente
                                )
                              }

                              style={{
                                flex: 1,

                                minWidth: '120px',

                                padding: '8px 10px',

                                background: '#6F8A6B',

                                color: '#FFFFFF',

                                border: 'none',

                                borderRadius: '7px',

                                fontSize: '9px',

                                fontWeight: '700',

                                cursor: 'pointer'
                              }}
                            >
                              ✓ Aceitar Orçamento
                            </button>


                            <button
                              type="button"

                              onClick={() =>
                                onRecusarProposta(
                                  msg.id_mensagem ||
                                  msg.id,

                                  msg.id_remetente ||
                                  msg.idRemetente
                                )
                              }

                              style={{
                                flex: 1,

                                minWidth: '100px',

                                padding: '8px 10px',

                                background: '#FFF7F7',

                                color: '#9B5D5D',

                                border:
                                  '1px solid #E9CFCF',

                                borderRadius: '7px',

                                fontSize: '9px',

                                fontWeight: '700',

                                cursor: 'pointer'
                              }}
                            >
                              ✕ Recusar
                            </button>

                          </div>

                        ) : (

                          <div
                            style={{
                              color:
                                ehMinha
                                  ? '#EEDFE8'
                                  : '#847780',

                              fontSize: '9px',

                              fontStyle: 'italic',

                              textAlign: 'center'
                            }}
                          >
                            Aguardando aprovação da cliente...
                          </div>

                        )}

                      </div>

                    )}


                    {/* =================================
                        PROPOSTA DE PROVA
                    ================================== */}

                    {ehPropostaProva && (

                      <div
                        style={{
                          marginTop: '9px',

                          padding: '10px',

                          background:
                            ehMinha
                              ? 'rgba(255,255,255,0.09)'
                              : '#FAF8F7',

                          border:
                            ehMinha
                              ? '1px solid rgba(255,255,255,0.16)'
                              : '1px solid #E6DDE2',

                          borderRadius: '8px'
                        }}
                      >


                        {statusCard ===
                        'recusada' ? (

                          <div
                            style={{
                              padding: '8px',

                              background: '#FFF0F0',

                              color: '#9B5D5D',

                              border:
                                '1px solid #F0D6D6',

                              borderRadius: '6px',

                              fontSize: '9px',

                              fontWeight: '700',

                              textAlign: 'center'
                            }}
                          >
                            ✕ Data de Prova Recusada
                          </div>

                        ) : statusCard ===
                          'aceita' ? (

                          <div
                            style={{
                              padding: '8px',

                              background: '#EEF5EE',

                              color: '#557255',

                              border:
                                '1px solid #D7E6D7',

                              borderRadius: '6px',

                              fontSize: '9px',

                              fontWeight: '700',

                              textAlign: 'center'
                            }}
                          >
                            ✓ Prova Confirmada (Adicionada à Agenda)
                          </div>

                        ) : pedidoEncerrado ? (

                          <div
                            style={{
                              padding: '8px',

                              background: '#F4F1F2',

                              color: '#746A70',

                              border:
                                '1px solid #E2DBDE',

                              borderRadius: '6px',

                              fontSize: '9px',

                              fontWeight: '700',

                              textAlign: 'center'
                            }}
                          >
                            Pedido Encerrado (Sugestão Inválida)
                          </div>

                        ) : !isCostureira ? (

                          <div
                            style={{
                              display: 'flex',

                              gap: '7px',

                              marginTop: '5px',

                              flexWrap: 'wrap'
                            }}
                          >

                            <button
                              type="button"

                              onClick={() =>
                                onAceitarProva &&
                                onAceitarProva(
                                  msg.id_mensagem ||
                                  msg.id,

                                  dadosProposta,

                                  msg.id_remetente ||
                                  msg.idRemetente
                                )
                              }

                              style={{
                                flex: 1,

                                minWidth: '110px',

                                padding: '8px 10px',

                                background: '#6F8A6B',

                                color: '#FFFFFF',

                                border: 'none',

                                borderRadius: '7px',

                                fontSize: '9px',

                                fontWeight: '700',

                                cursor: 'pointer'
                              }}
                            >
                              ✓ Aceitar Prova
                            </button>


                            <button
                              type="button"

                              onClick={() =>
                                onRecusarProva &&
                                onRecusarProva(
                                  msg.id_mensagem ||
                                  msg.id,

                                  msg.id_remetente ||
                                  msg.idRemetente
                                )
                              }

                              style={{
                                flex: 1,

                                minWidth: '100px',

                                padding: '8px 10px',

                                background: '#FFF7F7',

                                color: '#9B5D5D',

                                border:
                                  '1px solid #E9CFCF',

                                borderRadius: '7px',

                                fontSize: '9px',

                                fontWeight: '700',

                                cursor: 'pointer'
                              }}
                            >
                              ✕ Recusar
                            </button>

                          </div>

                        ) : (

                          <div
                            style={{
                              color:
                                ehMinha
                                  ? '#EEDFE8'
                                  : '#847780',

                              fontSize: '9px',

                              fontStyle: 'italic',

                              textAlign: 'center'
                            }}
                          >
                            Aguardando confirmação da cliente...
                          </div>

                        )}

                      </div>

                    )}


                    {/* HORA */}

                    <div
                      style={{
                        marginTop: '4px',

                        color:
                          ehMinha
                            ? '#EEDFE8'
                            : '#AAA0A7',

                        fontSize: '8px',

                        textAlign: 'right'
                      }}
                    >
                      {formatarHoraMsg(
                        rawData
                      )}
                    </div>

                  </div>

                </div>

              </React.Fragment>

            );

          }
        )}


        <div
          ref={
            chatBottomRef
          }
        />

      </div>


      {/* =====================================
          AVISOS
      ====================================== */}

      {pedidoCancelado && (

        <div
          style={{
            padding: '8px 14px',

            background: '#FFF8EC',

            color: '#806A59',

            borderTop:
              '1px solid #F1E0C7',

            fontSize: '9px',

            lineHeight: '1.5',

            textAlign: 'center'
          }}
        >
          <strong>
            Pedido cancelado:
          </strong>{' '}
          o chat permanece aberto para vocês combinarem a retirada de peças ou pendências.
        </div>

      )}


      {!isCostureira &&
       temPropostaPendente && (

        <div
          style={{
            padding: '8px 14px',

            background: '#FFF8EC',

            color: '#806A59',

            borderTop:
              '1px solid #F1E0C7',

            fontSize: '9px',

            lineHeight: '1.5',

            textAlign: 'center'
          }}
        >
          <strong>
            Orçamento recebido:
          </strong>{' '}
          confira o perfil e as avaliações da costureira antes de aceitar. O Ateliê Entre Linhas apenas facilita o contato e não se responsabiliza pelos serviços combinados.
        </div>

      )}


      {!isCostureira &&
       !temPropostaPendente &&
       temProvaPendente && (

        <div
          style={{
            padding: '8px 14px',

            background: '#FFF8EC',

            color: '#806A59',

            borderTop:
              '1px solid #F1E0C7',

            fontSize: '9px',

            lineHeight: '1.5',

            textAlign: 'center'
          }}
        >
          <strong>
            Sugestão de prova recebida:
          </strong>{' '}
          confira a data, o horário e o endereço da costureira acima antes de aceitar.
        </div>

      )}


      {/* =====================================
          ENVIO DE MENSAGEM
      ====================================== */}

      <form
        onSubmit={
          handleSubmit
        }

        style={{
          padding: '12px 13px',

          display: 'flex',

          alignItems: 'center',

          gap: '8px',

          background: '#FFFFFF',

          borderTop:
            '1px solid #EEE7E3'
        }}
      >

        <input
          type="text"

          value={
            novaMensagem
          }

          onChange={(e) =>
            setNovaMensagem(
              e.target.value
            )
          }

          placeholder={
            pedidoCancelado
              ? 'Envie uma mensagem para combinar a retirada ou pendências...'
              : 'Digite sua mensagem...'
          }

          style={{
            flex: 1,

            minWidth: 0,

            height: '40px',

            padding: '0 13px',

            boxSizing: 'border-box',

            background: '#FAF8F7',

            color: '#514950',

            border:
              '1px solid #DDD4D9',

            borderRadius: '9px',

            outline: 'none',

            fontFamily:
              "'Poppins', 'Segoe UI', sans-serif",

            fontSize: '10px'
          }}
        />


        <button
          type="submit"

          style={{
            height: '40px',

            padding: '0 17px',

            background: '#7A5B72',

            color: '#FFFFFF',

            border: 'none',

            borderRadius: '8px',

            fontFamily:
              "'Poppins', 'Segoe UI', sans-serif",

            fontSize: '9px',

            fontWeight: '700',

            cursor: 'pointer'
          }}
        >
          Enviar
        </button>

      </form>


    </section>

  );

}


export default ChatMessageList;