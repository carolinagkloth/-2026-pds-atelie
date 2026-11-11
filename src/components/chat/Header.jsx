import React, { useState, useEffect } from 'react';

function SininhoNotificacoes({ usuarioId }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [menuAberto, setMenuAberto] = useState(false);

  // 1. Carrega as notificações ao iniciar
  useEffect(() => {
    if (usuarioId) {
      fetch(`/api/notificacoes/usuario/${usuarioId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setNotificacoes(data);
        })
        .catch(console.error);
    }
  }, [usuarioId]);

  // 2. FUNÇÃO QUE MARCA COMO LIDA NO BANCO DE DADOS E NA TELA
  const handleMarcarComoLida = async (idNotificacao) => {
    try {
      // Faz a requisição PATCH para o Backend atualizar a coluna lida = true
      await fetch(`/api/notificacoes/${idNotificacao}/lida`, {
        method: 'PATCH'
      });

      // Atualiza o estado visual imediatamente para sumir o destaque da notificação
      setNotificacoes((prev) =>
        prev.map((item) =>
          (item.id_notificacao === idNotificacao || item.id === idNotificacao)
            ? { ...item, lida: true }
            : item
        )
      );
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  // Contagem de não lidas para a bolinha vermelha do sininho
  const naoLidasCount = notificacoes.filter((n) => !n.lida).length;

  return (
    <div style={{ position: 'relative' }}>
      {/* Botão do Sininho com contador */}
      <button 
        onClick={() => setMenuAberto(!menuAberto)} 
        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', position: 'relative' }}
      >
        🔔
        {naoLidasCount > 0 && (
          <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
            {naoLidasCount}
          </span>
        )}
      </button>

      {/* Dropdown com a lista de notificações */}
      {menuAberto && (
        <div style={{ position: 'absolute', right: 0, top: '35px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', width: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000 }}>
          <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '14px', color: '#3E2445' }}>
            Notificações
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notificacoes.length === 0 ? (
              <div style={{ padding: '15px', fontSize: '12px', color: '#777', textAlign: 'center' }}>
                Nenhuma notificação no momento.
              </div>
            ) : (
              notificacoes.map((item) => (
                <div
                  key={item.id_notificacao || item.id}
                  onClick={() => handleMarcarComoLida(item.id_notificacao || item.id)}
                  style={{
                    padding: '12px 15px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: item.lida ? '#fff' : '#FAF2FC', // Cor diferente para não lidas
                    opacity: item.lida ? 0.6 : 1
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '13px', color: '#3E2445' }}>
                    {item.titulo}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#555', display: 'block', marginTop: '2px' }}>
                    {item.mensagem}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SininhoNotificacoes;