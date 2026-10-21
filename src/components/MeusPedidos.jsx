import React from 'react';

function MeusPedidos({ pedidos, usuarioLogado, onAbrirChat }) {
  const meusPedidos = pedidos.filter(
    (p) => p.clienteId === usuarioLogado?.id || p.clienteNome === usuarioLogado?.nome
  );

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#3E2445', marginBottom: '20px' }}>Meus Pedidos Publicados</h2>

      {meusPedidos.length === 0 ? (
        <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
          <p>Você ainda não publicou nenhum pedido de costura.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {meusPedidos.map((pedido) => (
            <div
              key={pedido.id}
              style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                justify: 'space-between'
              }}
            >
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1 }}>
                {/* RENDERIZAÇÃO DA FOTO NO CARTÃO DO CLIENTE */}
                {pedido.fotoReferencia && !pedido.fotoReferencia.includes('placeholder') && (
                  <img
                    src={pedido.fotoReferencia}
                    alt="Foto de referência"
                    style={{
                      width: '90px',
                      height: '90px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #eee',
                      flexShrink: 0
                    }}
                  />
                )}

                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      background: pedido.status === 'Disponível' ? '#e3f2fd' : pedido.status === 'Em Negociação' ? '#fff3e0' : '#e8f5e9',
                      color: pedido.status === 'Disponível' ? '#1565c0' : pedido.status === 'Em Negociação' ? '#e65100' : '#2e7d32'
                    }}
                  >
                    {pedido.status}
                  </span>

                  <h4 style={{ margin: '0 0 5px 0', color: '#3E2445' }}>{pedido.tiposervico}</h4>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#555' }}>{pedido.descricao}</p>
                  <small style={{ color: '#888' }}>Prazo: {pedido.prazoDesejado} • Local: {pedido.localizacao}</small>
                </div>
              </div>

              {pedido.status === 'Em Negociação' && (
                <button
                  onClick={() => onAbrirChat(pedido)}
                  style={{
                    padding: '8px 16px',
                    background: '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  💬 Abrir Chat de Negociação
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MeusPedidos;