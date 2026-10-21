import React, { useState } from 'react';

function FeedPedidos({ pedidos, usuarioLogado, onDemonstrarInteresse }) {
  const [filtroServico, setFiltroServico] = useState('Todos');
  const [buscaLocalizacao, setBuscaLocalizacao] = useState('');

  // Filtra apenas pedidos disponíveis
  const pedidosDisponiveis = pedidos.filter((ped) => {
    const atendeStatus = ped.status === 'Disponível';
    const atendeServico = filtroServico === 'Todos' || ped.tiposervico === filtroServico;
    const atendeLocal = ped.localizacao.toLowerCase().includes(buscaLocalizacao.toLowerCase());
    return atendeStatus && atendeServico && atendeLocal;
  });

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#3E2445', margin: 0 }}>Mural Público de Pedidos</h2>
        <span style={{ fontSize: '14px', color: '#666' }}>{pedidosDisponiveis.length} solicitações disponíveis</span>
      </div>

      {/* BARRA DE FILTROS */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '4px' }}>Tipo de Serviço:</label>
          <select value={filtroServico} onChange={(e) => setFiltroServico(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="Todos">Todos os Serviços</option>
            <option value="Ajuste">Ajuste / Conserto</option>
            <option value="Confecção sob medida">Confecção sob Medida</option>
            <option value="Customização">Customização / Bordado</option>
            <option value="Vestido de Festa">Vestido de Festa</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '4px' }}>Buscar por Localização:</label>
          <input
            type="text"
            placeholder="Ex: Centro, Ponta Grossa..."
            value={buscaLocalizacao}
            onChange={(e) => setBuscaLocalizacao(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* LISTAGEM DE CARDS DE PEDIDOS */}
      {pedidosDisponiveis.length === 0 ? (
        <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', textAlign: 'center', color: '#777' }}>
          <h3>Nenhum pedido disponível no momento com esses filtros.</h3>
          <p>Tente mudar os filtros de busca ou aguarde novas publicações dos clientes.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {pedidosDisponiveis.map((pedido) => (
            <div key={pedido.id} style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* RENDERIZAÇÃO DA FOTO ENVIADA PELA CLIENTE */}
                {pedido.fotoReferencia && !pedido.fotoReferencia.includes('placeholder') && (
                  <div style={{ width: '100%', height: '200px', overflow: 'hidden', borderRadius: '6px', marginBottom: '15px', background: '#f5f5f5' }}>
                    <img
                      src={pedido.fotoReferencia}
                      alt="Referência da peça"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ background: '#EAE3EA', color: '#3E2445', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    {pedido.tiposervico}
                  </span>
                  <small style={{ color: '#888' }}>{pedido.dataPublicacao}</small>
                </div>

                <h3 style={{ margin: '0 0 10px 0', color: '#3E2445', fontSize: '18px' }}>
                  Pedido de {pedido.clienteNome}
                </h3>

                <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.5', marginBottom: '15px' }}>
                  {pedido.descricao}
                </p>

                <div style={{ fontSize: '13px', color: '#666', marginBottom: '15px', lineHeight: '1.6' }}>
                  <div>📍 <strong>Localização:</strong> {pedido.localizacao}</div>
                  <div>📅 <strong>Prazo limite:</strong> {pedido.prazoDesejado}</div>
                </div>
              </div>

              {usuarioLogado?.tipo_usuario === 'Costureira' ? (
                <button
                  onClick={() => onDemonstrarInteresse(pedido)}
                  style={{ width: '100%', padding: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  💬 Demonstrar Interesse e Iniciar Chat
                </button>
              ) : (
                <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', textAlign: 'center' }}>
                  Apenas contas de Costureira podem demonstrar interesse neste pedido.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedPedidos;