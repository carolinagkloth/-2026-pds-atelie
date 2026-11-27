import React, { useState } from 'react';

function AvatarPerfil({ usuario, onClick, tamanho = 40 }) {
  const [erroImagem, setErroImagem] = useState(false);

  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const user = usuario && Object.keys(usuario).length > 0 ? usuario : usuarioSalvo;
  const foto = user?.foto_perfil;
  const primeiraLetra = (user?.nome || 'U').trim().charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      title="Ver Perfil"
      aria-label="Ver Perfil"
      style={{
        width: `${tamanho}px`,
        height: `${tamanho}px`,
        borderRadius: '50%',
        border: '2px solid #3E2445',
        background: '#3E2445',
        color: '#fff',
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(62, 36, 69, 0.18)',
        transition: 'transform 0.15s ease'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {foto && !erroImagem ? (
        <img
          src={foto}
          alt={user?.nome || 'Foto de perfil'}
          referrerPolicy="no-referrer"
          onError={() => setErroImagem(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span style={{ fontSize: `${Math.round(tamanho * 0.42)}px`, fontWeight: 'bold', userSelect: 'none' }}>
          {primeiraLetra}
        </span>
      )}
    </button>
  );
}

export default AvatarPerfil;