import React, {
  useState,
  useEffect
} from 'react';

import '../styles/AvatarPerfil.css';


function AvatarPerfil({
  usuario,
  onClick,
  tamanho = 40
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


  useEffect(() => {

    setErroImagem(
      false
    );

  }, [foto]);


  return (

    <button
      type="button"

      onClick={
        onClick
      }

      title="Ver Perfil"

      aria-label="Ver Perfil"

      className="avatar-perfil"

      style={{
        width:
          `${tamanho}px`,

        height:
          `${tamanho}px`,

        '--avatar-font-size':
          `${Math.round(
            tamanho * 0.42
          )}px`
      }}
    >

      {foto &&
       !erroImagem ? (

        <img
          src={foto}

          alt={
            user?.nome ||
            'Foto de perfil'
          }

          referrerPolicy="no-referrer"

          onError={() =>
            setErroImagem(
              true
            )
          }
        />

      ) : (

        <span>
          {primeiraLetra}
        </span>

      )}

    </button>

  );

}


export default AvatarPerfil;