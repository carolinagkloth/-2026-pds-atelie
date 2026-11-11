import React from 'react';

function ChatHeader({ nomeUsuario, isCostureira, carregando, onRefresh, onNavigate }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '20px 25px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', marginBottom: '20px' }}>
      <div>
        <h2 style={{ color: '#3E2445', margin: 0, fontSize: '22px' }}>Chat de Negociação</h2>
        <span style={{ fontSize: '13px', color: '#666', marginTop: '4px', display: 'block' }}>
          Usuário: <strong>{nomeUsuario}</strong> ({isCostureira ? 'Costureira' : 'Cliente'})
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button 
          onClick={onRefresh} 
          disabled={carregando}
          style={{ padding: '9px 16px', background: '#fff', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
        >
          {carregando ? '🔄 Atualizando...' : '🔄 Atualizar'}
        </button>
        <button onClick={() => onNavigate && onNavigate('meusChats')} style={{ padding: '9px 16px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
          Conversas
        </button>
        <button onClick={() => onNavigate && onNavigate(isCostureira ? 'feedPedidos' : 'meusPedidos')} style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
          Ver Pedidos
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;