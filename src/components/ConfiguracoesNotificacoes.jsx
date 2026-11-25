import React, {
  useEffect,
  useState
} from 'react';


function ConfiguracoesNotificacoes({
  usuario,
  onNavigate
}) {

  const idUsuario =
    usuario?.id_usuario ||
    usuario?.id;


  const isCostureira =
    (
      usuario?.tipo_usuario ||
      usuario?.tipoUsuario ||
      ''
    )
      .toString()
      .toLowerCase() ===
    'costureira';


  const [config, setConfig] =
    useState({
      receber_whatsapp: true,
      notif_proposta: true,
      notif_chat: true,
      notif_prova: true,
      notif_status: true,
      notif_lembrete: true,
      notif_avaliacao: true,
      notif_cancelamento: true
    });


  const [carregando, setCarregando] =
    useState(true);


  const [salvando, setSalvando] =
    useState(false);


  /* ========================================
     CARREGAR CONFIGURAÇÕES
  ======================================== */

  useEffect(() => {

    if (!idUsuario) {

      setCarregando(false);

      return;

    }


    fetch(
      `/api/usuarios/${idUsuario}/configuracoes-notificacoes`
    )

      .then((res) =>
        res.json()
      )

      .then((data) => {

        if (
          data &&
          !data.erro
        ) {

          setConfig({

            receber_whatsapp:
              data.receber_whatsapp ??
              true,

            notif_proposta:
              data.notif_proposta ??
              true,

            notif_chat:
              data.notif_chat ??
              true,

            notif_prova:
              data.notif_prova ??
              true,

            notif_status:
              data.notif_status ??
              true,

            notif_lembrete:
              data.notif_lembrete ??
              true,

            notif_avaliacao:
              data.notif_avaliacao ??
              true,

            notif_cancelamento:
              data.notif_cancelamento ??
              true

          });

        }

      })

      .catch(() => {})

      .finally(() => {

        setCarregando(false);

      });

  }, [idUsuario]);


  /* ========================================
     SALVAR
  ======================================== */

  const handleSalvar =
    async () => {

      setSalvando(true);


      try {

        const response =
          await fetch(
            `/api/usuarios/${idUsuario}/configuracoes-notificacoes`,
            {
              method:
                'PUT',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify(
                  config
                )
            }
          );


        if (response.ok) {

          alert(
            'Preferências salvas com sucesso!'
          );


          if (onNavigate) {

            onNavigate(
              isCostureira
                ? 'feedPedidos'
                : 'areaCliente'
            );

          }

        } else {

          alert(
            'Erro ao salvar.'
          );

        }

      } catch (err) {

        alert(
          `Erro: ${err.message}`
        );

      } finally {

        setSalvando(false);

      }

    };


  const toggle = (
    chave
  ) => {

    setConfig(
      (prev) => ({
        ...prev,
        [chave]:
          !prev[chave]
      })
    );

  };


  const handleVoltar = () => {

    if (!onNavigate) {
      return;
    }


    onNavigate(
      isCostureira
        ? 'feedPedidos'
        : 'areaCliente'
    );

  };


  return (

    <main
      style={{
        width:
          'min(820px, 92%)',

        margin:
          '38px auto 75px',

        fontFamily:
          "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

        color:
          '#4A424A'
      }}
    >


      {/* =====================================
          CABEÇALHO
      ====================================== */}

      <section
        style={{
          display:
            'flex',

          justifyContent:
            'space-between',

          alignItems:
            'flex-end',

          gap:
            '20px',

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
                '9px',

              fontWeight:
                '700',

              letterSpacing:
                '1.3px',

              textTransform:
                'uppercase'
            }}
          >
            Preferências
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
                '32px',

              lineHeight:
                '1.15'
            }}
          >
            Notificações
          </h1>


          <p
            style={{
              maxWidth:
                '600px',

              margin:
                '8px 0 0',

              color:
                '#857885',

              fontSize:
                '12px',

              lineHeight:
                '1.65'
            }}
          >
            Escolha quais avisos deseja
            receber sobre mensagens,
            propostas, provas e andamento
            dos seus pedidos.
          </p>

        </div>


        <button
          type="button"

          onClick={
            handleVoltar
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
              '9px',

            fontFamily:
              "'Plus Jakarta Sans', sans-serif",

            fontSize:
              '10px',

            fontWeight:
              '700',

            cursor:
              'pointer'
          }}
        >
          ← {
            isCostureira
              ? 'Mural de pedidos'
              : 'Área do cliente'
          }
        </button>

      </section>


      {/* =====================================
          CARD
      ====================================== */}

      <section
        style={{
          overflow:
            'hidden',

          background:
            '#FFFFFF',

          border:
            '1px solid #E5D8DC',

          borderRadius:
            '18px',

          boxShadow:
            '0 12px 34px rgba(62,36,69,0.065)'
        }}
      >


        {/* TOPO */}

        <div
          style={{
            padding:
              '24px 26px',

            background:
              '#FAF3F2',

            borderBottom:
              '1px solid #E9DCDF'
          }}
        >

          <span
            style={{
              display:
                'block',

              marginBottom:
                '5px',

              color:
                '#917687',

              fontSize:
                '9px',

              fontWeight:
                '700',

              letterSpacing:
                '1px',

              textTransform:
                'uppercase'
            }}
          >
            Seus avisos
          </span>


          <h2
            style={{
              margin:
                0,

              color:
                '#3E2445',

              fontFamily:
                "'Playfair Display', Georgia, serif",

              fontSize:
                '21px'
            }}
          >
            Como deseja ser notificado?
          </h2>

        </div>


        <div
          style={{
            padding:
              '25px 26px'
          }}
        >

          {carregando ? (

            <div
              style={{
                minHeight:
                  '220px',

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
              Carregando preferências...
            </div>

          ) : (

            <>


              {/* =================================
                  WHATSAPP
              ================================== */}

              <div
                style={{
                  marginBottom:
                    '25px'
                }}
              >

                <span
                  style={{
                    display:
                      'block',

                    marginBottom:
                      '9px',

                    color:
                      '#917687',

                    fontSize:
                      '9px',

                    fontWeight:
                      '700',

                    letterSpacing:
                      '0.8px',

                    textTransform:
                      'uppercase'
                  }}
                >
                  WhatsApp
                </span>


                <ItemToggle
                  label="Receber mensagens no WhatsApp"

                  descricao="Avisos importantes sobre provas, propostas aceitas e lembretes."

                  ativo={
                    config.receber_whatsapp
                  }

                  onToggle={() =>
                    toggle(
                      'receber_whatsapp'
                    )
                  }

                  destaque
                />

              </div>


              {/* =================================
                  E-MAIL
              ================================== */}

              <div>

                <span
                  style={{
                    display:
                      'block',

                    marginBottom:
                      '9px',

                    color:
                      '#917687',

                    fontSize:
                      '9px',

                    fontWeight:
                      '700',

                    letterSpacing:
                      '0.8px',

                    textTransform:
                      'uppercase'
                  }}
                >
                  Notificações por e-mail
                </span>


                <div
                  style={{
                    display:
                      'flex',

                    flexDirection:
                      'column',

                    gap:
                      '9px'
                  }}
                >

                  <ItemToggle
                    label="Propostas de orçamento"

                    descricao={
                      isCostureira
                        ? 'Avisos sobre propostas e negociações relacionadas aos pedidos.'
                        : 'Avisos quando houver propostas de costureiras para seus pedidos.'
                    }

                    ativo={
                      config.notif_proposta
                    }

                    onToggle={() =>
                      toggle(
                        'notif_proposta'
                      )
                    }
                  />


                  <ItemToggle
                    label="Novas mensagens no chat"

                    descricao="Avisos quando houver uma nova mensagem em suas conversas."

                    ativo={
                      config.notif_chat
                    }

                    onToggle={() =>
                      toggle(
                        'notif_chat'
                      )
                    }
                  />


                  <ItemToggle
                    label="Agendamento de prova"

                    descricao="Avisos sobre sugestões, confirmações e datas de prova da peça."

                    ativo={
                      config.notif_prova
                    }

                    onToggle={() =>
                      toggle(
                        'notif_prova'
                      )
                    }
                  />


                  <ItemToggle
                    label="Mudança de status"

                    descricao="Atualizações sobre o andamento do serviço."

                    ativo={
                      config.notif_status
                    }

                    onToggle={() =>
                      toggle(
                        'notif_status'
                      )
                    }
                  />


                  <ItemToggle
                    label="Lembretes de compromisso"

                    descricao="Lembretes de provas e entregas próximas."

                    ativo={
                      config.notif_lembrete
                    }

                    onToggle={() =>
                      toggle(
                        'notif_lembrete'
                      )
                    }
                  />


                  <ItemToggle
                    label="Solicitação de avaliação"

                    descricao={
                      isCostureira
                        ? 'Avisos relacionados às avaliações de serviços realizados.'
                        : 'Lembretes para avaliar a costureira após a conclusão do serviço.'
                    }

                    ativo={
                      config.notif_avaliacao
                    }

                    onToggle={() =>
                      toggle(
                        'notif_avaliacao'
                      )
                    }
                  />


                  <ItemToggle
                    label="Cancelamento de pedidos"

                    descricao="Avisos quando houver cancelamento de um pedido ou serviço."

                    ativo={
                      config.notif_cancelamento
                    }

                    onToggle={() =>
                      toggle(
                        'notif_cancelamento'
                      )
                    }
                  />

                </div>

              </div>


              {/* =================================
                  SALVAR
              ================================== */}

              <div
                style={{
                  marginTop:
                    '25px',

                  paddingTop:
                    '20px',

                  borderTop:
                    '1px solid #EEE4E6'
                }}
              >

                <button
                  type="button"

                  onClick={
                    handleSalvar
                  }

                  disabled={
                    salvando
                  }

                  style={{
                    width:
                      '100%',

                    minHeight:
                      '44px',

                    background:
                      '#7A5B72',

                    color:
                      '#FFFFFF',

                    border:
                      'none',

                    borderRadius:
                      '9px',

                    fontFamily:
                      "'Plus Jakarta Sans', sans-serif",

                    fontSize:
                      '11px',

                    fontWeight:
                      '700',

                    cursor:
                      salvando
                        ? 'not-allowed'
                        : 'pointer',

                    opacity:
                      salvando
                        ? 0.65
                        : 1,

                    boxShadow:
                      '0 6px 16px rgba(62,36,69,0.10)'
                  }}
                >
                  {salvando
                    ? 'Salvando...'
                    : 'Salvar preferências'
                  }
                </button>

              </div>

            </>

          )}

        </div>

      </section>

    </main>

  );

}


/* ========================================
   ITEM DE CONFIGURAÇÃO
======================================== */

function ItemToggle({
  label,
  descricao,
  ativo,
  onToggle,
  destaque = false
}) {

  return (

    <label
      style={{
        minHeight:
          '70px',

        padding:
          '14px 15px',

        display:
          'flex',

        alignItems:
          'center',

        justifyContent:
          'space-between',

        gap:
          '18px',

        background:
          destaque
            ? '#F1F6F1'
            : '#FCF9F9',

        border:
          destaque
            ? '1px solid #D8E5D8'
            : '1px solid #E9DEE1',

        borderRadius:
          '11px',

        cursor:
          'pointer'
      }}
    >

      <div
        style={{
          minWidth:
            0
        }}
      >

        <strong
          style={{
            display:
              'block',

            marginBottom:
              '4px',

            color:
              '#4F3C49',

            fontSize:
              '11px',

            fontWeight:
              '700'
          }}
        >
          {label}
        </strong>


        <span
          style={{
            display:
              'block',

            color:
              '#857885',

            fontSize:
              '9px',

            lineHeight:
              '1.5'
          }}
        >
          {descricao}
        </span>

      </div>


      <input
        type="checkbox"

        checked={
          ativo
        }

        onChange={
          onToggle
        }

        style={{
          width:
            '19px',

          height:
            '19px',

          flexShrink:
            0,

          cursor:
            'pointer',

          accentColor:
            '#7A5B72'
        }}
      />

    </label>

  );

}


export default ConfiguracoesNotificacoes;