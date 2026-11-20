import React, { useState, useEffect } from 'react';


function ModalProva({
  isOpen,
  onClose,
  onEnviar,
  enderecoCostureira,
  onIrParaPerfil
}) {

  const [
    dataProva,
    setDataProva
  ] = useState('');


  const [
    horarioProva,
    setHorarioProva
  ] = useState('14:00');


  const [
    observacao,
    setObservacao
  ] = useState('');


  const [
    erro,
    setErro
  ] = useState('');


  const agora =
    new Date();


  const hoje =
    `${agora.getFullYear()}-${String(
      agora.getMonth() + 1
    ).padStart(2, '0')}-${String(
      agora.getDate()
    ).padStart(2, '0')}`;


  const horaAtual =
    `${String(
      agora.getHours()
    ).padStart(2, '0')}:${String(
      agora.getMinutes()
    ).padStart(2, '0')}`;


  useEffect(() => {

    if (isOpen) {

      setDataProva('');

      setHorarioProva(
        '14:00'
      );

      setObservacao('');

      setErro('');

    }

  }, [isOpen]);


  if (!isOpen) {
    return null;
  }


  const enderecoLimpo =
    (
      enderecoCostureira ||
      ''
    ).trim();


  const handleSubmit = (e) => {

    e.preventDefault();

    setErro('');


    if (!enderecoLimpo) {

      setErro(
        'Cadastre seu endereço de atendimento no Perfil antes de propor uma prova.'
      );

      return;

    }


    if (!dataProva) {

      setErro(
        'Selecione a data sugerida para a prova.'
      );

      return;

    }


    if (!horarioProva) {

      setErro(
        'Informe o horário obrigatório para a prova.'
      );

      return;

    }


    if (
      dataProva === hoje &&
      horarioProva <= horaAtual
    ) {

      setErro(
        `Para hoje, escolha um horário posterior ao horário atual (${horaAtual}).`
      );

      return;

    }


    onEnviar({
      dataProva,
      horarioProva,
      observacao,
      local: enderecoLimpo
    });

  };


  return (

    <div
      style={{
        position: 'fixed',

        inset: 0,

        zIndex: 1100,

        display: 'flex',

        alignItems: 'center',
        justifyContent: 'center',

        padding: '18px',

        background:
          'rgba(43, 29, 40, 0.50)',

        backdropFilter:
          'blur(4px)'
      }}
    >

      <div
        style={{
          width:
            'min(470px, 100%)',

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
            marginBottom:
              '18px',

            paddingBottom:
              '15px',

            borderBottom:
              '1px solid #EEE7E3'
          }}
        >

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
            Propor Data para Prova da Peça
          </h3>


          <p
            style={{
              margin:
                '6px 0 0',

              color:
                '#91858E',

              fontSize:
                '9px',

              lineHeight:
                '1.6'
            }}
          >
            A cliente receberá esta sugestão no chat para confirmar se pode comparecer no dia e horário.
          </p>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* DATA + HORÁRIO */}

          <div
            style={{
              display:
                'grid',

              gridTemplateColumns:
                '1fr 1fr',

              gap:
                '10px',

              marginBottom:
                '14px'
            }}
          >


            <div>

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
                Data Sugerida *
              </label>


              <input
                type="date"

                min={
                  hoje
                }

                value={
                  dataProva
                }

                onChange={(e) =>
                  setDataProva(
                    e.target.value
                  )
                }

                required

                style={{
                  width:
                    '100%',

                  height:
                    '41px',

                  padding:
                    '0 10px',

                  boxSizing:
                    'border-box',

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
                    '10px'
                }}
              />

            </div>


            <div>

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
                Horário da Prova *
              </label>


              <input
                type="time"

                min={
                  dataProva === hoje
                    ? horaAtual
                    : undefined
                }

                value={
                  horarioProva
                }

                onChange={(e) =>
                  setHorarioProva(
                    e.target.value
                  )
                }

                required

                style={{
                  width:
                    '100%',

                  height:
                    '41px',

                  padding:
                    '0 10px',

                  boxSizing:
                    'border-box',

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
                    '10px'
                }}
              />

            </div>


          </div>


          {/* LOCAL */}

          <div
            style={{
              marginBottom:
                '14px',

              padding:
                '11px 12px',

              background:
                enderecoLimpo
                  ? '#F8F3F6'
                  : '#FFF8EC',

              color:
                enderecoLimpo
                  ? '#675463'
                  : '#806A59',

              border:
                enderecoLimpo
                  ? '1px solid #E4D7DF'
                  : '1px solid #F1DFC4',

              borderLeft:
                enderecoLimpo
                  ? '3px solid #917687'
                  : '3px solid #C39A66',

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
                  enderecoLimpo
                    ? '#6E5568'
                    : '#9A7040',

                fontSize:
                  '9px',

                fontWeight:
                  '700',

                textTransform:
                  'uppercase',

                letterSpacing:
                  '0.4px'
              }}
            >
              Local da Prova
            </span>


            {enderecoLimpo ? (

              <>

                <strong
                  style={{
                    display:
                      'block',

                    color:
                      '#5F525C',

                    fontSize:
                      '10px'
                  }}
                >
                  {enderecoLimpo}
                </strong>


                <span
                  style={{
                    display:
                      'block',

                    marginTop:
                      '3px',

                    color:
                      '#91858E'
                  }}
                >
                  Este é o endereço de atendimento cadastrado no seu perfil.
                </span>

              </>

            ) : (

              <div
                style={{
                  color:
                    '#806A59'
                }}
              >

                Você ainda não cadastrou um endereço no seu perfil.


                {onIrParaPerfil && (

                  <button
                    type="button"

                    onClick={
                      onIrParaPerfil
                    }

                    style={{
                      display:
                        'block',

                      marginTop:
                        '8px',

                      padding:
                        '8px 11px',

                      background:
                        '#7A5B72',

                      color:
                        '#FFFFFF',

                      border:
                        'none',

                      borderRadius:
                        '7px',

                      fontFamily:
                        "'Poppins', sans-serif",

                      fontSize:
                        '8px',

                      fontWeight:
                        '700',

                      cursor:
                        'pointer'
                    }}
                  >
                    Completar Endereço no Meu Perfil
                  </button>

                )}

              </div>

            )}

          </div>


          {/* OBSERVAÇÕES */}

          <div
            style={{
              marginBottom:
                '14px'
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
              Observações (opcional)
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

              placeholder="Ex.: Traga o sapato que usará com a peça..."

              style={{
                width:
                  '100%',

                minHeight:
                  '85px',

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
                '1px solid #EEE7E3'
            }}
          >

            <button
              type="button"

              onClick={
                onClose
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
                  'pointer'
              }}
            >
              Cancelar
            </button>


            <button
              type="submit"

              disabled={
                !enderecoLimpo
              }

              style={{
                padding:
                  '10px 16px',

                background:
                  '#7A5B72',

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
                  enderecoLimpo
                    ? 'pointer'
                    : 'not-allowed',

                opacity:
                  enderecoLimpo
                    ? 1
                    : 0.55
              }}
            >
              Enviar Sugestão de Prova
            </button>

          </div>


        </form>

      </div>

    </div>

  );

}


export default ModalProva;