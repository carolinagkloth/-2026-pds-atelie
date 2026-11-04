import React, { useState, useEffect, useRef } from 'react';

function BotaoNotificacoes({ usuario, onNavigate }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [menuAberto, setMenuAberto] = useState(false);
  const dropdownRef = useRef(null);

  const idUsuario = usuario?.id_usuario || usuario?.id;

  useEffect(() => {
    if (idUsuario) {
      carregarNotificacoes();
      const interval = setInterval(carregarNotificacoes, 10000);
      return () => clearInterval(interval);
    }
  }, [idUsuario]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const carregarNotificacoes = () => {
    fetch(`/api/notificacoes/usuario/${idUsuario}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setNotificacoes(data);
      })
      .catch(() => {});
  };

  const handleMarcarTodasLidas = async () => {
    try {
      await fetch(`/api/notificacoes/usuario/${idUsuario}/marcar-todas-lidas`, { method: 'PUT' });
      setNotificacoes(notificacoes.map((n) => ({ ...n, lida: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClicarNotificacao = async (notif) => {
    if (!notif.lida) {
      await fetch(`/api/notificacoes/${notif.id_notificacao}/lida`, { method: 'PUT' });
      setNotificacoes(notificacoes.map((n) => n.id_notificacao === notif.id_notificacao ? { ...n, lida: true } : n));
    }

    if (notif.id_pedido && onNavigate) {
      setMenuAberto(false);
      onNavigate('chat', { id: notif.id_pedido, id_pedido: notif.id_pedido });
    }
  };

  const naoLidasCount = notificacoes.filter((n) => !n.lida).length;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setMenuAberto(!menuAberto)}
        style={{
          position: 'relative',
          background: '#F4EFF5',
          border: '1px solid #3E2445',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          outline: 'none'
        }}
        title="Notificações"
      >
        <span style={{ fontSize: '18px' }}>🔔</span>
        {naoLidasCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#D32F2F',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '10px',
              padding: '2px 6px',
              minWidth: '16px',
              textAlign: 'center'
            }}
          >
            {naoLidasCount > 9 ? '9+' : naoLidasCount}
          </span>
        )}
      </button>

      {menuAberto && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '350px',
            maxWidth: '90vw',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.18)',
            border: '1px solid #E0E0E0',
            zIndex: 2000,
            overflow: 'hidden',
            fontFamily: "'Segoe UI', Tahoma, sans-serif"
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #eee', background: '#3E2445', color: '#fff' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Notificações</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {naoLidasCount > 0 && (
                <button
                  onClick={handleMarcarTodasLidas}
                  style={{ background: 'none', border: 'none', color: '#EADCEB', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Marcar lidas
                </button>
              )}
              <button
                onClick={() => {
                  setMenuAberto(false);
                  if (onNavigate) onNavigate('configuracoesNotificacoes');
                }}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}
                title="Configurações"
              >
                ⚙️
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notificacoes.length === 0 ? (
              <div style={{ padding: '25px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                Nenhuma notificação por enquanto.
              </div>
            ) : (
              notificacoes.map((n) => (
                <div
                  key={n.id_notificacao}
                  onClick={() => handleClicarNotificacao(n)}
                  style={{
                    padding: '12px 15px',
                    borderBottom: '1px solid #f0f0f0',
                    background: n.lida ? '#fff' : '#FAF3FC',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: n.lida ? '#CCC' : '#3E2445' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: n.lida ? 'normal' : 'bold', color: '#3E2445' }}>{n.titulo}</div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '2px', lineHeight: '1.3' }}>{n.mensagem}</div>
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                      {new Date(n.data_criacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BotaoNotificacoes;