import React, { useState, useEffect } from 'react';


const formatarDataBR = (yyyyMmDd) => {

  if (!yyyyMmDd) return '';


  if (
    typeof yyyyMmDd === 'string' &&
    yyyyMmDd.includes('-')
  ) {

    const [
      ano,
      mes,
      dia
    ] =
      yyyyMmDd
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
    new Date(yyyyMmDd);


  return isNaN(
    d.getTime()
  )
    ? yyyyMmDd
    : d.toLocaleDateString(
        'pt-BR'
      );

};


function ModalCancelarProva({
  isOpen,
  onClose,
  onConfirmar,
  provaAgendada,
  isCostureira,
  enviando
}) {

  const [
    observacao,
    setObservacao
  ] = useState('');


  const [
    erro,
    setErro
  ] = useState('');


  useEffect(() => {

    if (isOpen) {

      setObservacao('');

      setErro('');

    }

  }, [isOpen]);


  if (!isOpen) {
    return null;
  }


  const dataFormatada =
    formatarDataBR(
      provaAgendada?.dataProva
    );


  const horarioTexto =
    provaAgendada?.semPreferenciaHorario
      ? 'Horário a combinar'
      : (
          provaAgendada?.horarioProva ||
          ''
        );


  const handleSubmit = async (e) => {

    e.preventDefault();

    setErro('');


    try {

      await onConfirmar(
        observacao.trim()
      );

    } catch (err) {

      setErro(
        err.message ||
        'Não foi possível cancelar a prova.'
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
            'min(500px, 100%)',

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
                display:
                  'block',

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
              Agendamento
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
              Cancelar Prova Agendada
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


        {/* RESUMO DA PROVA */}

        {dataFormatada && (

          <div
            style={{
              marginBottom:
                '14px',

              padding:
                '11px 12px',

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
                  '3px',

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
              Prova agendada
            </span>


            <div>

              <strong
                style={{
                  color:
                    '#5F525C'
                }}
              >
                Data:
              </strong>{' '}

              {dataFormatada}

              {horarioTexto
                ? ` (${horarioTexto})`
                : ''
              }

            </div>


            {provaAgendada?.local && (

              <div
                style={{
                  marginTop:
                    '4px'
                }}
              >

                <strong
                  style={{
                    color:
                      '#5F525C'
                  }}
                >
                  Local:
                </strong>{' '}

                {provaAgendada.local}

              </div>

            )}

          </div>

        )}


        {/* AVISO */}

        <div
          style={{
            marginBottom:
              '17px',

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
            Atenção ao cancelar o agendamento
          </strong>


          Ao confirmar, esta prova será removida da agenda e{' '}

          {isCostureira
            ? 'a cliente'
            : 'a costureira'
          }

          {' '}será notificada para que vocês possam alinhar uma nova data pelo chat.


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

            por agendamentos, comparecimentos, atrasos ou acordos combinados entre as partes.
          </span>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* OBSERVAÇÃO */}

          <div
            style={{
              marginBottom:
                '15px'
            }}
          >

            <label
              style={{
                display:
                  'block',

                marginBottom:
                  '6px',

                color:
                  '#5F525C',

                fontSize:
                  '9px',

                fontWeight:
                  '600'
              }}
            >
              Motivo ou observação (opcional)
            </label>


            <textarea
              rows="3"

              value={
                observacao
              }

              onChange={(e) =>
                setObservacao(
                  e.target.value
                )
              }

              placeholder="Ex.: Tive um imprevisto nesse horário, podemos remarcar para amanhã?"

              style={{
                width:
                  '100%',

                minHeight:
                  '90px',

                padding:
                  '10px 12px',

                boxSizing:
                  'border-box',

                resize:
                  'vertical',

                background:
                  '#FAF8F7',

                color:
                  '#4F474D',

                border:
                  '1px solid #DED6D1',

                borderRadius:
                  '8px',

                outline:
                  'none',

                fontFamily:
                  "'Poppins', sans-serif",

                fontSize:
                  '10px',

                lineHeight:
                  '1.6'
              }}
            />

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

              marginTop:
                '18px',

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
              type="submit"

              disabled={
                enviando
              }

              style={{
                padding:
                  '10px 16px',

                background:
                  '#9B5D5D',

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
                ? 'Cancelando...'
                : 'Confirmar Cancelamento da Prova'
              }
            </button>

          </div>


        </form>

      </div>

    </div>

  );

}


export default ModalCancelarProva;