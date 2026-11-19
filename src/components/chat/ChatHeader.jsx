import React, { useState, useEffect } from 'react';

function ChatHeader({ nomeUsuario, fotoPerfil, isCostureira, onNavigate }) {
  const [erroImagem, setErroImagem] = useState(false);

  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const nomeExibir = nomeUsuario || usuarioSalvo?.nome || 'Usuário';
  const fotoExibir = fotoPerfil !== undefined ? fotoPerfil : (usuarioSalvo?.foto_perfil || '');
  const primeiraLetra = nomeExibir.trim().charAt(0).toUpperCase();

  useEffect(() => {
    setErroImagem(false);
  }, [fotoExibir]);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      {/* Botão Voltar para Conversas */}
      <button
        type="button"
        onClick={() => onNavigate && onNavigate('meusChats')}
        style={{
          padding: '8px 14px',
          background: '#F4EFF5',
          color: '#3E2445',
          border: '1px solid #3E2445',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '13px',
          cursor: 'pointer'
        }}
      >
        ← Voltar para Conversas
      </button>

      {/* Botão de Acesso Rápido ao Perfil / Agenda */}
      <button
        type="button"
        onClick={() => onNavigate && onNavigate('perfil')}
        title="Abrir Meu Perfil e Agenda"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#FAF6FA',
          border: '1px solid #EADCEB',
          borderRadius: '999px',
          padding: '5px 14px 5px 6px',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#3E2445',
            border: '2px solid #3E2445',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {fotoExibir && !erroImagem ? (
            <img
              src={fotoExibir}
              alt={nomeExibir}
              referrerPolicy="no-referrer"
              onError={() => setErroImagem(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', userSelect: 'none' }}>
              {primeiraLetra}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#3E2445' }}>
            {nomeExibir}
          </span>
          <span style={{ fontSize: '11px', color: '#666' }}>
            {isCostureira ? 'Meu Perfil • Agenda' : 'Meu Perfil'}
          </span>
        </div>
      </button>
    </div>
  );
}

export default ChatHeader;