import React, {
  useState,
  useEffect
} from 'react';


function ChatHeader({
  nomeUsuario,
  fotoPerfil,
  isCostureira,
  onNavigate
}) {

  const [
    erroImagem,
    setErroImagem
  ] = useState(false);


  const usuarioSalvo = (() => {

    try {

      const item =
        localStorage.getItem(
          'usuarioAtelie'
        );


      return (
        item &&
        item !== 'undefined'
          ? JSON.parse(item)
          : {}
      );

    } catch {

      return {};

    }

  })();


  const nomeExibir =
    nomeUsuario ||
    usuarioSalvo?.nome ||
    'Usuário';


  const fotoExibir =
    fotoPerfil !== undefined
      ? fotoPerfil
      : (
          usuarioSalvo?.foto_perfil ||
          ''
        );


  const primeiraLetra =
    nomeExibir
      .trim()
      .charAt(0)
      .toUpperCase();


  useEffect(() => {

    setErroImagem(false);

  }, [fotoExibir]);


  return (

    <header
      style={{
        display:
          'flex',

        justifyContent:
          'space-between',

        alignItems:
          'center',

        gap:
          '16px',

        marginBottom:
          '18px',

        padding:
          '14px 18px',

        background:
          '#FFFFFF',

        border:
          '1px solid #EBE5E0',

        borderRadius:
          '13px',

        boxShadow:
          '0 6px 18px rgba(62,36,69,0.045)',

        flexWrap:
          'wrap'
      }}
    >


      {/* VOLTAR */}

      <button
        type="button"

        onClick={() =>
          onNavigate &&
          onNavigate(
            'meusChats'
          )
        }

        style={{
          height:
            '40px',

          padding:
            '0 14px',

          display:
            'flex',

          alignItems:
            'center',

          gap:
            '7px',

          background:
            '#FFFFFF',

          color:
            '#7A5B72',

          border:
            '1px solid #D8CFD5',

          borderRadius:
            '9px',

          fontFamily:
            "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

          fontSize:
            '11px',

          fontWeight:
            '700',

          cursor:
            'pointer'
        }}
      >

        <span
          style={{
            fontSize:
              '15px',

            lineHeight:
              1
          }}
        >
          ←
        </span>

        Voltar para conversas

      </button>


      {/* PERFIL DO USUÁRIO LOGADO */}

      <button
        type="button"

        onClick={() =>
          onNavigate &&
          onNavigate(
            'perfil'
          )
        }

        title={
          isCostureira
            ? 'Abrir perfil profissional e agenda'
            : 'Abrir meu perfil'
        }

        style={{
          display:
            'flex',

          alignItems:
            'center',

          gap:
            '10px',

          padding:
            '5px 13px 5px 5px',

          background:
            '#FAF3F2',

          border:
            '1px solid #E2D4D9',

          borderRadius:
            '999px',

          cursor:
            'pointer',

          textAlign:
            'left'
        }}
      >


        {/* AVATAR */}

        <div
          style={{
            width:
              '39px',

            height:
              '39px',

            flexShrink:
              0,

            display:
              'flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            overflow:
              'hidden',

            background:
              '#F1DFE3',

            border:
              '1px solid #DFC9D1',

            borderRadius:
              '50%',

            boxShadow:
              '0 2px 8px rgba(62,36,69,0.07)'
          }}
        >

          {fotoExibir &&
           !erroImagem ? (

            <img
              src={
                fotoExibir
              }

              alt={
                nomeExibir
              }

              referrerPolicy="no-referrer"

              onError={() =>
                setErroImagem(
                  true
                )
              }

              style={{
                width:
                  '100%',

                height:
                  '100%',

                display:
                  'block',

                objectFit:
                  'cover'
              }}
            />

          ) : (

            <span
              style={{
                color:
                  '#7A5B72',

                fontFamily:
                  "'Playfair Display', Georgia, serif",

                fontSize:
                  '16px',

                fontWeight:
                  '700',

                userSelect:
                  'none'
              }}
            >
              {primeiraLetra}
            </span>

          )}

        </div>


        {/* NOME */}

        <div
          style={{
            display:
              'flex',

            flexDirection:
              'column',

            gap:
              '1px',

            lineHeight:
              '1.3'
          }}
        >

          <span
            style={{
              color:
                '#4F3C49',

              fontFamily:
                "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

              fontSize:
                '11px',

              fontWeight:
                '700'
            }}
          >
            {nomeExibir}
          </span>


          <span
            style={{
              color:
                '#92858E',

              fontFamily:
                "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

              fontSize:
                '9px'
            }}
          >
            {isCostureira
              ? 'Perfil profissional • Agenda'
              : 'Conta de cliente'}
          </span>

        </div>

      </button>

    </header>

  );

}


export default ChatHeader;