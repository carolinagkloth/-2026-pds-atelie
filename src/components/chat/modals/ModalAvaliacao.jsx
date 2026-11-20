import React, { useState } from 'react';


function ModalAvaliacao({
  isOpen,
  onClose,
  onEnviar
}) {

  const [nota, setNota] =
    useState(5);


  const [
    comentario,
    setComentario
  ] = useState('');


  if (!isOpen) {
    return null;
  }


  const handleSubmit = (e) => {

    e.preventDefault();

    onEnviar({
      nota,
      comentario
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
            'min(450px, 100%)',

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
              '20px',

            paddingBottom:
              '15px',

            borderBottom:
              '1px solid #EEE7E3',

            textAlign:
              'center'
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
            Experiência
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
            Avaliar Serviço da Costureira
          </h3>


          <p
            style={{
              margin:
                '6px auto 0',

              maxWidth:
                '340px',

              color:
                '#91858E',

              fontSize:
                '9px',

              lineHeight:
                '1.6'
            }}
          >
            Sua avaliação ajuda outras clientes a conhecerem melhor o trabalho realizado.
          </p>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* NOTA */}

          <div
            style={{
              marginBottom:
                '20px',

              padding:
                '16px 12px',

              background:
                '#FAF8F7',

              border:
                '1px solid #EEE7E3',

              borderRadius:
                '10px',

              textAlign:
                'center'
            }}
          >

            <label
              style={{
                display:
                  'block',

                marginBottom:
                  '10px',

                color:
                  '#5F525C',

                fontSize:
                  '9px',

                fontWeight:
                  '600'
              }}
            >
              Sua Nota (1 a 5 estrelas)
            </label>


            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'center',

                gap:
                  '4px',

                color:
                  '#D3A84E',

                fontSize:
                  '32px',

                lineHeight:
                  1,

                cursor:
                  'pointer',

                userSelect:
                  'none'
              }}
            >

              {[1, 2, 3, 4, 5].map(
                (estrela) => (

                  <span
                    key={
                      estrela
                    }

                    onClick={() =>
                      setNota(
                        estrela
                      )
                    }

                    title={`${estrela} estrela${estrela > 1 ? 's' : ''}`}
                  >
                    {estrela <= nota
                      ? '★'
                      : '☆'
                    }
                  </span>

                )
              )}

            </div>


            <span
              style={{
                display:
                  'block',

                marginTop:
                  '8px',

                color:
                  '#998C95',

                fontSize:
                  '8px'
              }}
            >
              {nota} de 5
            </span>

          </div>


          {/* COMENTÁRIO */}

          <div
            style={{
              marginBottom:
                '18px'
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
              Comentário / Depoimento
            </label>


            <textarea
              rows="4"

              value={
                comentario
              }

              onChange={(e) =>
                setComentario(
                  e.target.value
                )
              }

              placeholder="Conte como foi o atendimento e o acabamento..."

              style={{
                width:
                  '100%',

                minHeight:
                  '105px',

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
              type="submit"

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
              Enviar Avaliação
            </button>

          </div>


        </form>

      </div>

    </div>

  );

}


export default ModalAvaliacao;