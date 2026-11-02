import React, { useState, useEffect } from 'react';

const COLUNAS_KANBAN = [
  { id: 'A Fazer', titulo: '📌 A Fazer', cor: '#757575' },
  { id: 'Em Produção', titulo: '✂️ Em Produção', cor: '#29B6F6' },
  { id: 'Aguardando Prova', titulo: '🔍 Aguardando Prova', cor: '#FFA726' },
  { id: 'Concluído', titulo: '✅ Concluído', cor: '#66BB6A' }
];

function KanbanOrdens({ idCostureira, onNavigate }) {
  const [ordens, setOrdens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarOrdens = async () => {
    setCarregando(true);
    try {
      const response = await fetch(`/api/ordens-servico/usuario/${idCostureira}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao carregar ordens de serviço.');
      setOrdens(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (idCostureira) carregarOrdens();
  }, [idCostureira]);

  const handleMoverStatus = async (idOrdem, novoStatus) => {
    try {
      const response = await fetch(`/api/ordens-servico/${idOrdem}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_kanban: novoStatus })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao mudar status.');

      // Atualiza o estado localmente sem precisar recarregar toda a lista
      setOrdens((prev) =>
        prev.map((ordem) =>
          ordem.id === idOrdem ? { ...ordem, statusKanban: novoStatus } : ordem
        )
      );
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#3E2445', margin: 0 }}>Quadro Kanban - Ordens de Serviço</h2>
        {onNavigate && (
          <button
            onClick={() => onNavigate('perfil')}
            style={{ padding: '8px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Ver Perfil
          </button>
        )}
      </div>

      {carregando && <p style={{ textAlign: 'center', color: '#666' }}>Carregando quadro...</p>}
      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px' }}>{erro}</div>}

      {!carregando && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
          {COLUNAS_KANBAN.map((coluna) => {
            const ordensDaColuna = ordens.filter(
              (o) => (o.statusKanban || 'A Fazer') === coluna.id
            );

            return (
              <div
                key={coluna.id}
                style={{
                  background: '#FAF8F5',
                  borderRadius: '10px',
                  padding: '15px',
                  borderTop: `5px solid ${coluna.cor}`,
                  minHeight: '400px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#3E2445' }}>{coluna.titulo}</h3>
                  <span style={{ background: '#E8D5C4', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    {ordensDaColuna.length}
                  </span>
                </div>

                {ordensDaColuna.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px',
                      border: '1px solid #E8D5C4',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                    }}
                  >
                    <strong style={{ display: 'block', color: '#3E2445', fontSize: '14px', marginBottom: '4px' }}>
                      Cliente: {item.clienteNome}
                    </strong>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#555', lineHeight: '1.4' }}>
                      {item.pedidoDescricao}
                    </p>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                      <strong>Valor:</strong> R$ {Number(item.valorTotal).toFixed(2)}<br />
                      <strong>Entrega:</strong> {item.previsaoEntrega ? new Date(item.previsaoEntrega).toLocaleDateString('pt-BR') : 'Não informada'}
                    </div>

                    {/* Botões para transição de status */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                      {coluna.id !== 'A Fazer' && (
                        <button
                          onClick={() => {
                            const prevIndex = COLUNAS_KANBAN.findIndex((c) => c.id === coluna.id) - 1;
                            handleMoverStatus(item.id, COLUNAS_KANBAN[prevIndex].id);
                          }}
                          style={{ padding: '4px 8px', fontSize: '11px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ← Voltar
                        </button>
                      )}

                      {coluna.id !== 'Concluído' && (
                        <button
                          onClick={() => {
                            const nextIndex = COLUNAS_KANBAN.findIndex((c) => c.id === coluna.id) + 1;
                            handleMoverStatus(item.id, COLUNAS_KANBAN[nextIndex].id);
                          }}
                          style={{ padding: '4px 8px', fontSize: '11px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}
                        >
                          Avançar →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default KanbanOrdens;