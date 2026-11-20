import React from 'react';
import {
  exportarPDF,
  exportarTXT,
  formatarDataBR
} from './utils/chatExport';


const obterEstiloStatus = (status) => {

  const s =
    (status || '')
      .toLowerCase();


  if (
    s === 'aberto' ||
    s === 'disponível'
  ) {

    return {
      background: '#EEF5EE',
      border: '1px solid #D7E6D7',
      color: '#557255'
    };

  }


  if (
    s === 'aguardando prova'
  ) {

    return {
      background: '#FFF7EA',
      border: '1px solid #F0DFC0',
      color: '#9A7040'
    };

  }


  if (
    s === 'em produção' ||
    s === 'a fazer'
  ) {

    return {
      background: '#EEF2F7',
      border: '1px solid #D8E0EA',
      color: '#5C6F85'
    };

  }


  if (
    s === 'concluído'
  ) {

    return {
      background: '#EDF6F3',
      border: '1px solid #D4E8E2',
      color: '#52766B'
    };

  }


  if (
    s === 'entregue'
  ) {

    return {
      background: '#F3ECEF',
      border: '1px solid #E1D4DC',
      color: '#7A5B72'
    };

  }


  if (
    s === 'cancelado'
  ) {

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


function ChatSidebar({
  orcamentoAtual,
  isCostureira,
  idCostureiraPedido,
  costureiraNome,
  clienteNome,
  medidas,
  pedido,
  idPedido,
  jaAvaliado,
  provaAgendada,
  temProvaPendente,
  onOpenProposta,
  onOpenProva,
  onCancelarProva,
  onConcluirServico,
  onConfirmarEntrega,
  onOpenAvaliacao,
  onCancelarPedido,
  onOpenMedidas,
  onNavigate
}) {

  const emAndamento =
    [
      'Em Produção',
      'Aguardando Prova',
      'Concluído'
    ].includes(
      orcamentoAtual.status
    );


  const pedidoFinalizado =
    [
      'Cancelado',
      'Entregue'
    ].includes(
      orcamentoAtual.status
    );


  const podeEnviarProposta =
    isCostureira &&
    !emAndamento &&
    !pedidoFinalizado;


  const temProvaAgendada =
    orcamentoAtual.status ===
    'Aguardando Prova';


  const nomeCostureiraExibir =
    costureiraNome ||
    pedido?.costureiraNome ||
    'Não informada';


  const nomeClienteExibir =
    clienteNome ||
    pedido?.clienteNome ||
    pedido?.nomeCliente ||
    'Cliente';


  const estiloStatus =
    obterEstiloStatus(
      orcamentoAtual.status
    );


  const dataProvaFormatada =
    provaAgendada?.dataProva
      ? formatarDataBR(
          provaAgendada.dataProva
        )
      : '';


  const horarioProvaTexto =
    provaAgendada?.semPreferenciaHorario

      ? 'horário a combinar'

      : (
          provaAgendada?.horarioProva
            ? `às ${provaAgendada.horarioProva}`
            : ''
        );


  const botaoPrincipal = {
    width: '100%',
    minHeight: '38px',
    padding: '9px 12px',
    border: 'none',
    borderRadius: '8px',
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    fontSize: '9px',
    fontWeight: '700',
    cursor: 'pointer'
  };


  const botaoSecundario = {
    width: '100%',
    minHeight: '36px',
    padding: '8px 11px',
    background: '#FFFFFF',
    color: '#7A5B72',
    border: '1px solid #D8CFD5',
    borderRadius: '8px',
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    fontSize: '9px',
    fontWeight: '600',
    cursor: 'pointer'
  };


  return (

    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >


      {/* =====================================
          STATUS E AÇÕES
      ====================================== */}

      <section
        style={{
          padding: '18px',

          background: '#FFFFFF',

          border: '1px solid #EBE5E0',

          borderRadius: '14px',

          boxShadow:
            '0 7px 20px rgba(62,36,69,0.045)'
        }}
      >


        <div
          style={{
            marginBottom: '15px'
          }}
        >

          <span
            style={{
              display: 'block',

              marginBottom: '3px',

              color: '#BB91AD',

              fontSize: '8px',

              fontWeight: '700',

              letterSpacing: '1px',

              textTransform: 'uppercase'
            }}
          >
            Acompanhamento
          </span>


          <h3
            style={{
              margin: 0,

              color: '#3E2445',

              fontFamily:
                "'Playfair Display SC', 'Playfair Display', Georgia, serif",

              fontSize: '17px'
            }}
          >
            Status do pedido
          </h3>

        </div>


        {/* STATUS */}

        <div
          style={{
            marginBottom: '12px',

            padding: '10px 11px',

            background:
              estiloStatus.background,

            border:
              estiloStatus.border,

            borderRadius: '8px'
          }}
        >

          <span
            style={{
              display: 'block',

              marginBottom: '2px',

              color: '#8B8087',

              fontSize: '8px',

              fontWeight: '600',

              textTransform: 'uppercase'
            }}
          >
            Status atual
          </span>


          <strong
            style={{
              color:
                estiloStatus.color,

              fontSize: '11px'
            }}
          >
            {orcamentoAtual.status}
          </strong>

        </div>


        {/* PARTICIPANTE */}

        <div
          style={{
            marginBottom: '12px',

            padding: '10px 11px',

            background: '#FAF8F7',

            border: '1px solid #EAE2E6',

            borderRadius: '8px'
          }}
        >

          <span
            style={{
              display: 'block',

              marginBottom: '3px',

              color: '#998C95',

              fontSize: '8px',

              fontWeight: '700',

              letterSpacing: '0.6px',

              textTransform: 'uppercase'
            }}
          >
            {isCostureira
              ? 'Cliente'
              : 'Costureira responsável'
            }
          </span>


          <strong
            style={{
              display: 'block',

              color: '#5F4B5B',

              fontSize: '10px'
            }}
          >
            {isCostureira
              ? nomeClienteExibir
              : nomeCostureiraExibir
            }
          </strong>

        </div>


        {/* PERFIL DA COSTUREIRA */}

        {!isCostureira &&
         idCostureiraPedido && (

          <button
            type="button"

            onClick={() =>
              onNavigate &&
              onNavigate(
                'portfolio',
                idCostureiraPedido
              )
            }

            style={{
              ...botaoSecundario,

              marginBottom: '10px',

              background: '#F8F3F6'
            }}
          >
            Ver Perfil da Costureira
          </button>

        )}


        {/* PRAZO */}

        {orcamentoAtual.prazo && (

          <div
            style={{
              marginBottom: '13px',

              paddingBottom: '12px',

              borderBottom:
                '1px solid #EEE7E3',

              color: '#6E646B',

              fontSize: '9px',

              lineHeight: '1.6'
            }}
          >

            <span
              style={{
                display: 'block',

                marginBottom: '2px',

                color: '#998C95',

                fontSize: '8px',

                fontWeight: '700',

                textTransform: 'uppercase'
              }}
            >
              Prazo de entrega
            </span>


            <strong
              style={{
                color: '#5F525C'
              }}
            >
              {formatarDataBR(
                orcamentoAtual.prazo
              )}
            </strong>

            {orcamentoAtual.horarioEntrega
              ? ` às ${orcamentoAtual.horarioEntrega}`
              : ''
            }

          </div>

        )}


        {/* =================================
            PROVA AGENDADA
        ================================== */}

        {emAndamento &&
         temProvaAgendada && (

          <div
            style={{
              marginBottom: '12px',

              padding: '11px',

              background: '#FFF8EC',

              color: '#806A59',

              border: '1px solid #F1DFC4',

              borderLeft:
                '3px solid #C39A66',

              borderRadius: '8px',

              fontSize: '9px',

              lineHeight: '1.55'
            }}
          >

            <strong
              style={{
                display: 'block',

                marginBottom: '4px',

                color: '#9A7040',

                fontSize: '10px'
              }}
            >
              Prova Agendada
            </strong>


            <div>

              {dataProvaFormatada ? (

                <>
                  Em{' '}
                  <strong>
                    {dataProvaFormatada}
                  </strong>{' '}

                  {horarioProvaTexto
                    ? `(${horarioProvaTexto})`
                    : ''
                  }

                  {' '}você tem uma prova agendada.
                </>

              ) : (

                <>
                  Você possui uma prova agendada para este pedido.
                </>

              )}

            </div>


            {provaAgendada?.local && (

              <div
                style={{
                  marginTop: '5px',

                  color: '#6F5E51'
                }}
              >
                <strong>
                  Local:
                </strong>{' '}

                {provaAgendada.local}
              </div>

            )}


            <button
              type="button"

              onClick={
                onCancelarProva
              }

              style={{
                ...botaoSecundario,

                marginTop: '9px',

                color: '#9B5D5D',

                border:
                  '1px solid #E9CFCF'
              }}
            >
              Cancelar Prova
            </button>

          </div>

        )}


        {/* =================================
            ENVIAR PROPOSTA
        ================================== */}

        {podeEnviarProposta && (

          <button
            type="button"

            onClick={
              onOpenProposta
            }

            style={{
              ...botaoPrincipal,

              marginBottom: '9px',

              background: '#7A5B72',

              color: '#FFFFFF'
            }}
          >
            + Enviar Orçamento
          </button>

        )}


        {/* =================================
            AÇÕES DA COSTUREIRA
        ================================== */}

        {isCostureira &&
         emAndamento && (

          <div
            style={{
              display: 'flex',

              flexDirection: 'column',

              gap: '7px'
            }}
          >


            {!temProvaAgendada &&
             !temProvaPendente && (

              <button
                type="button"

                onClick={
                  onOpenProva
                }

                style={{
                  ...botaoPrincipal,

                  background: '#71866F',

                  color: '#FFFFFF'
                }}
              >
                Agendar Prova da Peça
              </button>

            )}


            {!temProvaAgendada &&
             temProvaPendente && (

              <div
                style={{
                  padding: '9px 10px',

                  background: '#F7F1F5',

                  color: '#765F70',

                  border: '1px solid #E5D8E0',

                  borderRadius: '7px',

                  fontSize: '8px',

                  lineHeight: '1.5',

                  textAlign: 'center'
                }}
              >
                Sugestão de prova enviada — aguardando resposta da cliente.
              </div>

            )}


            {orcamentoAtual.status ===
             'Em Produção' && (

              <button
                type="button"

                onClick={
                  onConcluirServico
                }

                style={{
                  ...botaoPrincipal,

                  background: '#637A8E',

                  color: '#FFFFFF'
                }}
              >
                Concluir Peça
              </button>

            )}

          </div>

        )}


        {/* =================================
            ENTREGA
        ================================== */}

        {!isCostureira &&
         orcamentoAtual.status ===
          'Concluído' && (

          <button
            type="button"

            onClick={
              onConfirmarEntrega
            }

            style={{
              ...botaoPrincipal,

              marginTop: '9px',

              background: '#71866F',

              color: '#FFFFFF'
            }}
          >
            Confirmar Recebimento da Peça
          </button>

        )}


        {/* =================================
            AVALIAÇÃO
        ================================== */}

        {!isCostureira &&
         orcamentoAtual.status ===
          'Entregue' &&
         !jaAvaliado && (

          <button
            type="button"

            onClick={
              onOpenAvaliacao
            }

            style={{
              ...botaoPrincipal,

              marginTop: '9px',

              background: '#E8C77D',

              color: '#5B4633'
            }}
          >
            Avaliar Serviço da Costureira
          </button>

        )}


        {/* =================================
            CANCELAR PEDIDO
        ================================== */}

        {emAndamento && (

          <button
            type="button"

            onClick={
              onCancelarPedido
            }

            style={{
              ...botaoPrincipal,

              marginTop: '9px',

              background: '#FFF7F7',

              color: '#9B5D5D',

              border:
                '1px solid #E9CFCF'
            }}
          >
            {isCostureira
              ? 'Cancelar / Desistir do Pedido'
              : 'Cancelar Pedido'
            }
          </button>

        )}


        {/* =================================
            EXPORTAÇÃO
        ================================== */}

        <div
          style={{
            marginTop: '15px',

            paddingTop: '14px',

            display: 'flex',

            flexDirection: 'column',

            gap: '7px',

            borderTop:
              '1px solid #EEE7E3'
          }}
        >

          <span
            style={{
              marginBottom: '1px',

              color: '#998C95',

              fontSize: '8px',

              fontWeight: '700',

              letterSpacing: '0.6px',

              textTransform: 'uppercase'
            }}
          >
            Documentos
          </span>


          <button
            type="button"

            onClick={() =>
              exportarPDF({
                idPedido,
                orcamentoAtual,
                medidas,
                pedido,
                costureiraNome:
                  nomeCostureiraExibir
              })
            }

            style={{
              ...botaoSecundario,

              background: '#F8F3F6'
            }}
          >
            Exportar PDF (Contrato/Comprovante)
          </button>


          <button
            type="button"

            onClick={() =>
              exportarTXT({
                idPedido,
                orcamentoAtual,
                medidas,
                pedido,
                costureiraNome:
                  nomeCostureiraExibir
              })
            }

            style={{
              ...botaoSecundario,

              color: '#6E646B'
            }}
          >
            Baixar Ficha e Orçamento (TXT)
          </button>

        </div>


      </section>


      {/* =====================================
          FICHA DE MEDIDAS
      ====================================== */}

      <section
        style={{
          padding: '17px 18px',

          background: '#FFFFFF',

          border: '1px solid #EBE5E0',

          borderRadius: '14px',

          boxShadow:
            '0 7px 20px rgba(62,36,69,0.04)'
        }}
      >

        <div
          style={{
            display: 'flex',

            justifyContent: 'space-between',

            alignItems: 'center',

            gap: '10px',

            marginBottom: '12px'
          }}
        >

          <div>

            <span
              style={{
                display: 'block',

                marginBottom: '2px',

                color: '#BB91AD',

                fontSize: '8px',

                fontWeight: '700',

                letterSpacing: '0.8px',

                textTransform: 'uppercase'
              }}
            >
              Informações
            </span>


            <h3
              style={{
                margin: 0,

                color: '#3E2445',

                fontFamily:
                  "'Playfair Display SC', 'Playfair Display', Georgia, serif",

                fontSize: '15px'
              }}
            >
              Ficha de Medidas
            </h3>

          </div>


          <button
            type="button"

            onClick={
              onOpenMedidas
            }

            style={{
              padding: 0,

              background: 'transparent',

              color: '#7A5B72',

              border: 'none',

              fontFamily:
                "'Poppins', sans-serif",

              fontSize: '9px',

              fontWeight: '600',

              textDecoration: 'underline',

              cursor: 'pointer'
            }}
          >
            Editar
          </button>

        </div>


        <div
          style={{
            display: 'grid',

            gridTemplateColumns:
              'repeat(3, 1fr)',

            gap: '7px'
          }}
        >


          <div
            style={{
              padding: '9px 7px',

              background: '#FAF8F7',

              borderRadius: '7px',

              textAlign: 'center'
            }}
          >

            <span
              style={{
                display: 'block',

                marginBottom: '2px',

                color: '#998C95',

                fontSize: '7px',

                fontWeight: '700',

                textTransform: 'uppercase'
              }}
            >
              Busto
            </span>

            <strong
              style={{
                color: '#5F525C',

                fontSize: '10px'
              }}
            >
              {medidas.busto || '-'} cm
            </strong>

          </div>


          <div
            style={{
              padding: '9px 7px',

              background: '#FAF8F7',

              borderRadius: '7px',

              textAlign: 'center'
            }}
          >

            <span
              style={{
                display: 'block',

                marginBottom: '2px',

                color: '#998C95',

                fontSize: '7px',

                fontWeight: '700',

                textTransform: 'uppercase'
              }}
            >
              Cintura
            </span>

            <strong
              style={{
                color: '#5F525C',

                fontSize: '10px'
              }}
            >
              {medidas.cintura || '-'} cm
            </strong>

          </div>


          <div
            style={{
              padding: '9px 7px',

              background: '#FAF8F7',

              borderRadius: '7px',

              textAlign: 'center'
            }}
          >

            <span
              style={{
                display: 'block',

                marginBottom: '2px',

                color: '#998C95',

                fontSize: '7px',

                fontWeight: '700',

                textTransform: 'uppercase'
              }}
            >
              Quadril
            </span>

            <strong
              style={{
                color: '#5F525C',

                fontSize: '10px'
              }}
            >
              {medidas.quadril || '-'} cm
            </strong>

          </div>


        </div>

      </section>


    </aside>

  );

}


export default ChatSidebar;