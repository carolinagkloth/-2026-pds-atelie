import React, { useState, useEffect } from 'react';

function BarraNotificacoes({ usuario, onNavigate }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const idUsuario = usuario?.id_usuario || usuario?.id;

  useEffect(() => {
    if (idUsuario) {
      carregarAlertas();
    }
  }, [idUsuario]);

  const carregarAlertas = () => {
    fetch(`/api/conversas/usuario/${idUsuario}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const recentes = data
            .filter((c) => c.status && c.status !== 'Aberto')
            .map((c) => ({
              id: c.idPedido,
              texto: `O pedido "#${c.idPedido}" teve o status alterado para "${c.status}".`,
              pedido: c
            }));
          setNotificacoes(recentes.slice(0, 2));
        }
      })
      .catch(() => {});
  };

  if (notificacoes.length === 0) return null;

  return (
    <div style={{ background: '#FFF3E0', borderBottom: '1px solid #FFE082', padding: '10px 20px', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
        <div style={{ fontSize: '13px', color: '#E65100', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🔔</span>
          <span><strong>Atualização de Pedido:</strong> {notificacoes[0].texto}</span>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('chat', notificacoes[0].pedido)}
          style={{ background: '#E65100', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
        >
          Ver Chat
        </button>
      </div>
    </div>
  );
}

export default BarraNotificacoes;