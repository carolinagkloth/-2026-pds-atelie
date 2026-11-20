import React, { useState, useEffect } from 'react';


function ModalMedidas({
  isOpen,
  onClose,
  medidasAtuais,
  onSalvar
}) {

  const [
    medidas,
    setMedidas
  ] = useState(
    medidasAtuais
  );


  useEffect(() => {

    setMedidas(
      medidasAtuais
    );

  }, [medidasAtuais]);


  if (!isOpen) {
    return null;
  }


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
            'min(440px, 100%)',

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
            Cliente
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
            Editar Ficha de Medidas
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
            Atualize as medidas disponíveis para auxiliar no acompanhamento do pedido.
          </p>

        </div>


        {/* CAMPOS */}

        <div
          style={{
            display:
              'flex',

            flexDirection:
              'column',

            gap:
              '13px',

            marginBottom:
              '18px'
          }}
        >


          {/* BUSTO */}

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
              Busto (cm)
            </label>


            <input
              type="text"

              placeholder="Ex.: 92"

              value={
                medidas.busto ||
                ''
              }

              onChange={(e) =>
                setMedidas({
                  ...medidas,

                  busto:
                    e.target.value
                })
              }

              style={{
                width:
                  '100%',

                height:
                  '41px',

                padding:
                  '0 12px',

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


          {/* CINTURA */}

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
              Cintura (cm)
            </label>


            <input
              type="text"

              placeholder="Ex.: 74"

              value={
                medidas.cintura ||
                ''
              }

              onChange={(e) =>
                setMedidas({
                  ...medidas,

                  cintura:
                    e.target.value
                })
              }

              style={{
                width:
                  '100%',

                height:
                  '41px',

                padding:
                  '0 12px',

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


          {/* QUADRIL */}

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
              Quadril (cm)
            </label>


            <input
              type="text"

              placeholder="Ex.: 101"

              value={
                medidas.quadril ||
                ''
              }

              onChange={(e) =>
                setMedidas({
                  ...medidas,

                  quadril:
                    e.target.value
                })
              }

              style={{
                width:
                  '100%',

                height:
                  '41px',

                padding:
                  '0 12px',

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


          {/* OBSERVAÇÕES */}

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
              Outras medidas e observações
            </label>


            <textarea
              rows="4"

              placeholder="Ex.: comprimento da manga, altura, preferências de caimento..."

              value={
                medidas.observacoes_medidas ||
                ''
              }

              onChange={(e) =>
                setMedidas({
                  ...medidas,

                  observacoes_medidas:
                    e.target.value
                })
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


        </div>


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
            type="button"

            onClick={() =>
              onSalvar(
                medidas
              )
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
                'pointer'
            }}
          >
            Salvar Medidas
          </button>

        </div>


      </div>

    </div>

  );

}


export default ModalMedidas;