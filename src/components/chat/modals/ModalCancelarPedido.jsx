import React, { useState, useEffect } from 'react';


function ModalCancelarPedido({
  isOpen,
  onClose,
  onConfirmar,
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


  const handleConfirmar = async (e) => {

    e.preventDefault();

    setErro('');


    try {

      await onConfirmar(
        observacao
      );

    } catch (err) {

      setErro(
        err.message ||
        'Não foi possível cancelar o pedido.'
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
                  '#C58F8F',

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
              Encerrar negociação
            </span>


            <h3
              style={{
                margin: 0,

                color:
                  '#8E5353',

                fontFamily:
                  "'Playfair Display SC', 'Playfair Display', Georgia, serif",

                fontSize:
                  '21px'
              }}
            >
              {isCostureira
                ? 'Cancelar / Desistir do Pedido'
                : 'Cancelar Pedido'
              }
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
            Aviso Importante da Plataforma
          </strong>


          O{' '}
          <strong>
            Ateliê Entre Linhas
          </strong>{' '}
          atua apenas como ponte de contato entre clientes e costureiras,{' '}

          <strong>
            não se responsabilizando
          </strong>{' '}

          por acordos combinados diretamente entre as partes, entregas de materiais, prazos, valores ou eventuais imprevistos decorrentes do cancelamento.

        </div>


        <form
          onSubmit={
            handleConfirmar
          }
        >


          {/* OBSERVAÇÃO */}

          <div
            style={{
              marginBottom:
                '8px'
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
              Observação ou motivo do cancelamento{' '}

              <span
                style={{
                  color:
                    '#9A8E96',

                  fontWeight:
                    '400'
                }}
              >
                (opcional)
              </span>
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

              disabled={
                enviando
              }

              placeholder={
                isCostureira

                  ? 'Ex.: Não foi possível prosseguir pois o tecido necessário não foi entregue no prazo combinado...'

                  : 'Ex.: Precisei cancelar por um imprevisto pessoal ou falta de retorno sobre o ajuste...'
              }

              style={{
                width:
                  '100%',

                minHeight:
                  '95px',

                padding:
                  '10px 12px',

                boxSizing:
                  'border-box',

                resize:
                  'vertical',

                background:
                  enviando
                    ? '#F4F1F2'
                    : '#FAF8F7',

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
                  '1.6',

                opacity:
                  enviando
                    ? 0.7
                    : 1
              }}
            />

          </div>


          <span
            style={{
              display:
                'block',

              marginBottom:
                '16px',

              color:
                '#91858E',

              fontSize:
                '8px',

              lineHeight:
                '1.55'
            }}
          >
            Se você preencher este campo, a mensagem será enviada diretamente para{' '}

            <strong
              style={{
                color:
                  '#6E5568'
              }}
            >
              {isCostureira
                ? 'a cliente'
                : 'a costureira'
              }
            </strong>{' '}

            no chat e na notificação.
          </span>


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
                : 'Confirmar Cancelamento'
              }
            </button>

          </div>


        </form>

      </div>

    </div>

  );

}


export default ModalCancelarPedido;