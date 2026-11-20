import React, { useState } from 'react';

function AvatarPerfil({
  usuario,
  onClick,
  tamanho = 40
}) {

  const [erroImagem, setErroImagem] =
    useState(false);


  const usuarioSalvo = (() => {

    try {

      const item =
        localStorage.getItem(
          'usuarioAtelie'
        );


      return item &&
        item !== 'undefined'
        ? JSON.parse(item)
        : {};

    } catch {

      return {};

    }

  })();


  const user =
    usuario &&
    Object.keys(usuario).length > 0
      ? usuario
      : usuarioSalvo;


  const foto =
    user?.foto_perfil;


  const primeiraLetra =
    (
      user?.nome ||
      'U'
    )
      .trim()
      .charAt(0)
      .toUpperCase();


  return (

    <button
      type="button"

      onClick={onClick}

      title="Ver Perfil"

      aria-label="Ver Perfil"

      style={{
        width:
          `${tamanho}px`,

        height:
          `${tamanho}px`,

        borderRadius:
          '50%',

        border:
          '2px solid #E4D9E0',

        background:
          '#F3ECEF',

        color:
          '#7A5B72',

        padding:
          0,

        overflow:
          'hidden',

        display:
          'flex',

        alignItems:
          'center',

        justifyContent:
          'center',

        cursor:
          'pointer',

        flexShrink:
          0,

        boxShadow:
          '0 4px 12px rgba(62,36,69,0.08)',

        transition:
          'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease'
      }}

      onMouseEnter={(e) => {

        e.currentTarget.style.transform =
          'scale(1.05)';

        e.currentTarget.style.boxShadow =
          '0 6px 16px rgba(62,36,69,0.13)';

        e.currentTarget.style.borderColor =
          '#BB91AD';

      }}

      onMouseLeave={(e) => {

        e.currentTarget.style.transform =
          'scale(1)';

        e.currentTarget.style.boxShadow =
          '0 4px 12px rgba(62,36,69,0.08)';

        e.currentTarget.style.borderColor =
          '#E4D9E0';

      }}
    >

      {
        foto &&
        !erroImagem
          ? (

            <img
              src={foto}

              alt={
                user?.nome ||
                'Foto de perfil'
              }

              referrerPolicy="no-referrer"

              onError={() =>
                setErroImagem(true)
              }

              style={{
                width:
                  '100%',

                height:
                  '100%',

                objectFit:
                  'cover',

                display:
                  'block'
              }}
            />

          )
          : (

            <span
              style={{
                fontFamily:
                  "'Playfair Display', Georgia, serif",

                fontSize:
                  `${Math.round(
                    tamanho * 0.42
                  )}px`,

                fontWeight:
                  '700',

                userSelect:
                  'none'
              }}
            >
              {primeiraLetra}
            </span>

          )
      }

    </button>

  );

}

export default AvatarPerfil;