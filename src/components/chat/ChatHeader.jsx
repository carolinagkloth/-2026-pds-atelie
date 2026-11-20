import React, { useState, useEffect } from 'react';


function ChatHeader({
  nomeUsuario,
  fotoPerfil,
  isCostureira,
  onNavigate
}) {

  const [erroImagem, setErroImagem] =
    useState(false);


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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',

        gap: '16px',

        marginBottom: '18px',

        padding: '14px 18px',

        background: '#FFFFFF',

        border: '1px solid #EBE5E0',

        borderRadius: '13px',

        boxShadow:
          '0 6px 18px rgba(62,36,69,0.045)',

        flexWrap: 'wrap'
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
          height: '38px',

          padding: '0 14px',

          display: 'flex',

          alignItems: 'center',

          gap: '6px',

          background: '#FFFFFF',

          color: '#7A5B72',

          border:
            '1px solid #D8CFD5',

          borderRadius: '8px',

          fontFamily:
            "'Poppins', 'Segoe UI', sans-serif",

          fontSize: '10px',

          fontWeight: '600',

          cursor: 'pointer'
        }}
      >
        <span
          style={{
            fontSize: '14px',
            lineHeight: 1
          }}
        >
          ←
        </span>

        Voltar para conversas

      </button>


      {/* PERFIL */}

      <button
        type="button"

        onClick={() =>
          onNavigate &&
          onNavigate(
            'perfil'
          )
        }

        title="Abrir Meu Perfil e Agenda"

        style={{
          display: 'flex',

          alignItems: 'center',

          gap: '10px',

          padding: '5px 12px 5px 5px',

          background: '#FAF8F7',

          border:
            '1px solid #E6DDE2',

          borderRadius: '999px',

          cursor: 'pointer',

          textAlign: 'left'
        }}
      >


        {/* AVATAR */}

        <div
          style={{
            width: '37px',
            height: '37px',

            flexShrink: 0,

            display: 'flex',

            alignItems: 'center',
            justifyContent: 'center',

            overflow: 'hidden',

            background: '#F3ECEF',

            border:
              '1px solid #E2D5DD',

            borderRadius: '50%',

            boxShadow:
              '0 2px 8px rgba(62,36,69,0.07)'
          }}
        >

          {fotoExibir &&
           !erroImagem ? (

            <img
              src={fotoExibir}

              alt={nomeExibir}

              referrerPolicy="no-referrer"

              onError={() =>
                setErroImagem(
                  true
                )
              }

              style={{
                width: '100%',
                height: '100%',

                display: 'block',

                objectFit: 'cover'
              }}
            />

          ) : (

            <span
              style={{
                color: '#7A5B72',

                fontFamily:
                  "'Playfair Display SC', 'Playfair Display', Georgia, serif",

                fontSize: '15px',

                fontWeight: '700',

                userSelect: 'none'
              }}
            >
              {primeiraLetra}
            </span>

          )}

        </div>


        {/* NOME */}

        <div
          style={{
            display: 'flex',

            flexDirection: 'column',

            gap: '1px',

            lineHeight: '1.3'
          }}
        >

          <span
            style={{
              color: '#5F4B5B',

              fontFamily:
                "'Poppins', 'Segoe UI', sans-serif",

              fontSize: '10px',

              fontWeight: '600'
            }}
          >
            {nomeExibir}
          </span>


          <span
            style={{
              color: '#998C95',

              fontFamily:
                "'Poppins', 'Segoe UI', sans-serif",

              fontSize: '8px'
            }}
          >
            {isCostureira
              ? 'Meu Perfil • Agenda'
              : 'Meu Perfil'
            }
          </span>

        </div>

      </button>


    </header>

  );

}


export default ChatHeader;