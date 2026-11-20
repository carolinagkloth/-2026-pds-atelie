import React, { useState, useEffect } from 'react';


const formatarMoeda = (valor) => {

  const num =
    Number(valor) || 0;


  return num.toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL'
    }
  );

};


const formatarDataSegura = (dataStr) => {

  if (!dataStr) return '';


  if (
    typeof dataStr === 'string' &&
    dataStr.includes('-')
  ) {

    const [
      ano,
      mes,
      dia
    ] =
      dataStr
        .split('T')[0]
        .split('-');


    if (
      ano &&
      mes &&
      dia
    ) {

      return `${dia}/${mes}/${ano}`;

    }

  }


  const d =
    new Date(dataStr);


  return isNaN(
    d.getTime()
  )
    ? dataStr
    : d.toLocaleDateString(
        'pt-BR'
      );

};


function ModalAceitarProposta({
  isOpen,
  onClose,
  onConfirmar,
  dadosProposta,
  orcamentoAtual,
  costureiraNome,
  onVerPerfil,
  enviando
}) {

  const [
    erro,
    setErro
  ] = useState('');


  useEffect(() => {

    if (isOpen) {

      setErro('');

    }

  }, [isOpen]);


  if (!isOpen) {
    return null;
  }


  const valorTotal =
    Number(
      dadosProposta?.valorTotal ??
      orcamentoAtual?.total ??
      0
    );


  const valorEntrada =
    Number(
      dadosProposta?.valorEntrada ??
      orcamentoAtual?.entrada ??
      0
    );


  const previsaoEntrega =
    dadosProposta?.previsaoEntrega ||
    orcamentoAtual?.prazo ||
    '';


  const horarioEntrega =
    dadosProposta?.horarioEntrega ||
    orcamentoAtual?.horarioEntrega ||
    '';


  const handleConfirmar = async () => {

    setErro('');


    try {

      await onConfirmar();

    } catch (err) {

      setErro(
        err.message ||
        'Não foi possível aprovar o orçamento.'
      );

    }

  };


  return (

    <div
      style={{
        position: 'fixed',

        inset: 0,

        zIndex: 1200,

        display: 'flex',

        alignItems: 'center',
        justifyContent: 'center',

        padding: '18px',

        background:
          'rgba(43, 29, 40, 0.52)',

        backdropFilter:
          'blur(4px)'
      }}
    >

      <div
        style={{
          width:
            'min(520px, 100%)',

          maxHeight:
            '92vh',

          overflowY:
            'auto',

          padding:
            '25px',

          boxSizing:
            'border-box',

          background:
            '#FFFFFF',

          border:
            '1px solid #E8E0E4',

          borderRadius:
            '16px',

          boxShadow:
            '0 22px 60px rgba(43,29,40,0.22)',

          fontFamily:
            "'Poppins', 'Segoe UI', sans-serif"
        }}
      >


        {/* CABEÇALHO */}

        <div
          style={{
            display: 'flex',

            justifyContent:
              'space-between',

            alignItems:
              'flex-start',

            gap: '15px',

            marginBottom:
              '18px',

            paddingBottom:
              '15px',

            borderBottom:
              '1px solid #EEE7E3'
          }}
        >

          <div>

            <span
              style={{
                display: 'block',

                marginBottom:
                  '4px',

                color:
                  '#BB91AD',

                fontSize:
                  '8px',

                fontWeight:
                  '700',

                letterSpacing:
                  '1.1px',

                textTransform:
                  'uppercase'
              }}
            >
              Confirmação
            </span>


            <h3
              style={{
                margin: 0,

                color:
                  '#3E2445',

                fontFamily:
                  "'Playfair Display SC', 'Playfair Display', Georgia, serif",

                fontSize:
                  '21px'
              }}
            >
              Confirmar Aceite do Orçamento
            </h3>

          </div>


          <button
            type="button"

            onClick={
              onClose
            }

            disabled={
              enviando
            }

            aria-label="Fechar"

            style={{
              width:
                '32px',

              height:
                '32px',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              flexShrink:
                0,

              padding: 0,

              background:
                '#FAF8F7',

              color:
                '#7A5B72',

              border:
                '1px solid #E1D8DD',

              borderRadius:
                '50%',

              fontSize:
                '18px',

              lineHeight:
                1,

              cursor:
                enviando
                  ? 'not-allowed'
                  : 'pointer',

              opacity:
                enviando
                  ? 0.6
                  : 1
            }}
          >
            ×
          </button>

        </div>


        {/* RESUMO DO ORÇAMENTO */}

        <div
          style={{
            marginBottom:
              '14px',

            padding:
              '12px 13px',

            background:
              '#F8F3F6',

            color:
              '#675463',

            border:
              '1px solid #E4D7DF',

            borderRadius:
              '8px',

            fontSize:
              '9px',

            lineHeight:
              '1.55'
          }}
        >

          <span
            style={{
              display:
                'block',

              marginBottom:
                '5px',

              color:
                '#998C95',

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
            Resumo do orçamento
          </span>


          {costureiraNome && (

            <div
              style={{
                marginBottom:
                  '4px'
              }}
            >

              <strong
                style={{
                  color:
                    '#5F525C'
                }}
              >
                Costureira:
              </strong>{' '}

              {costureiraNome}

            </div>

          )}


          <div
            style={{
              marginBottom:
                previsaoEntrega
                  ? '4px'
                  : 0
            }}
          >

            <strong
              style={{
                color:
                  '#5F525C'
              }}
            >
              Valor Total:
            </strong>{' '}

            {formatarMoeda(
              valorTotal
            )}

            {valorEntrada > 0 &&
              ` (Entrada/Sinal: ${formatarMoeda(valorEntrada)})`
            }

          </div>


          {previsaoEntrega && (

            <div>

              <strong
                style={{
                  color:
                    '#5F525C'
                }}
              >
                Previsão de Entrega:
              </strong>{' '}

              {formatarDataSegura(
                previsaoEntrega
              )}

              {horarioEntrega
                ? ` às ${horarioEntrega}`
                : ''
              }

            </div>

          )}

        </div>


        {/* AVISO */}

        <div
          style={{
            marginBottom:
              '16px',

            padding:
              '12px 13px',

            background:
              '#FFF8EC',

            color:
              '#806A59',

            border:
              '1px solid #F1DFC4',

            borderLeft:
              '3px solid #C39A66',

            borderRadius:
              '8px',

            fontSize:
              '9px',

            lineHeight:
              '1.6'
          }}
        >

          <strong
            style={{
              display:
                'block',

              marginBottom:
                '4px',

              color:
                '#9A7040',

              fontSize:
                '10px'
            }}
          >
            Atenção antes de fechar o serviço
          </strong>


          Ao aceitar este orçamento, você está firmando um acordo diretamente com a costureira. Verifique o{' '}

          <strong>
            perfil, o portfólio e as avaliações
          </strong>{' '}

          dela para ter certeza de que é uma profissional de sua confiança.


          <span
            style={{
              display:
                'block',

              marginTop:
                '7px'
            }}
          >
            O{' '}

            <strong>
              Ateliê Entre Linhas
            </strong>{' '}

            atua apenas como ponte de contato entre clientes e costureiras,{' '}

            <strong>
              não se responsabilizando
            </strong>{' '}

            por prazos, qualidade do acabamento, pagamentos combinados ou entrega de peças e tecidos.
          </span>


          {onVerPerfil && (

            <button
              type="button"

              onClick={
                onVerPerfil
              }

              disabled={
                enviando
              }

              style={{
                marginTop:
                  '10px',

                padding:
                  '8px 11px',

                background:
                  '#FFFFFF',

                color:
                  '#7A5B72',

                border:
                  '1px solid #D8CFD5',

                borderRadius:
                  '7px',

                fontFamily:
                  "'Poppins', sans-serif",

                fontSize:
                  '8px',

                fontWeight:
                  '700',

                cursor:
                  enviando
                    ? 'not-allowed'
                    : 'pointer',

                opacity:
                  enviando
                    ? 0.6
                    : 1
              }}
            >
              Conferir Perfil e Avaliações da Costureira
            </button>

          )}

        </div>


        {/* ERRO */}

        {erro && (

          <div
            style={{
              marginBottom:
                '14px',

              padding:
                '9px 11px',

              background:
                '#FFF1F1',

              color:
                '#9B5D5D',

              border:
                '1px solid #F0D6D6',

              borderRadius:
                '7px',

              fontSize:
                '9px',

              lineHeight:
                '1.5'
            }}
          >
            {erro}
          </div>

        )}


        {/* BOTÕES */}

        <div
          style={{
            display:
              'flex',

            justifyContent:
              'flex-end',

            gap:
              '8px',

            paddingTop:
              '16px',

            borderTop:
              '1px solid #EEE7E3',

            flexWrap:
              'wrap'
          }}
        >

          <button
            type="button"

            onClick={
              onClose
            }

            disabled={
              enviando
            }

            style={{
              padding:
                '10px 15px',

              background:
                '#FFFFFF',

              color:
                '#7A5B72',

              border:
                '1px solid #D8CFD5',

              borderRadius:
                '8px',

              fontFamily:
                "'Poppins', sans-serif",

              fontSize:
                '9px',

              fontWeight:
                '600',

              cursor:
                enviando
                  ? 'not-allowed'
                  : 'pointer',

              opacity:
                enviando
                  ? 0.6
                  : 1
            }}
          >
            Voltar
          </button>


          <button
            type="button"

            onClick={
              handleConfirmar
            }

            disabled={
              enviando
            }

            style={{
              padding:
                '10px 16px',

              background:
                '#71866F',

              color:
                '#FFFFFF',

              border:
                'none',

              borderRadius:
                '8px',

              fontFamily:
                "'Poppins', sans-serif",

              fontSize:
                '9px',

              fontWeight:
                '700',

              cursor:
                enviando
                  ? 'not-allowed'
                  : 'pointer',

              opacity:
                enviando
                  ? 0.65
                  : 1
            }}
          >
            {enviando
              ? 'Confirmando...'
              : 'Estou Ciente e Aceitar'
            }
          </button>

        </div>


      </div>

    </div>

  );

}


export default ModalAceitarProposta;