import React, { useState } from 'react';

function TabelaPrecos({ modoEdicao = false }) {
  const [precos, setPrecos] = useState([
    { id: 1, servico: 'Ajuste de Barra (Calça/Saia)', valor: 30.00, categoria: 'Ajustes' },
    { id: 2, servico: 'Ajuste de Cintura', valor: 45.00, categoria: 'Ajustes' },
    { id: 3, servico: 'Troca de Zíper', valor: 25.00, categoria: 'Consertos' },
    { id: 4, servico: 'Vestido Sob Medida (Simples)', valor: 250.00, categoria: 'Confecção' }
  ]);

  const [novoServico, setNovoServico] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('Ajustes');

  const handleAdicionarPreco = (e) => {
    e.preventDefault();
    if (!novoServico || !novoValor) return;

    const item = {
      id: Date.now(),
      servico: novoServico,
      valor: parseFloat(novoValor),
      categoria: novaCategoria
    };

    setPrecos([...precos, item]);
    setNovoServico('');
    setNovoValor('');
  };

  const handleRemover = (id) => {
    setPrecos(precos.filter((p) => p.id !== id));
  };

  return (
    <div style={{ marginTop: '30px', borderTop: '2px solid #F4EFF5', paddingTop: '20px' }}>
      <h3 style={{ color: '#3E2445', marginTop: 0, fontSize: '18px' }}>Tabela de Preços Referenciais</h3>
      <p style={{ color: '#666', fontSize: '13px', marginBottom: '15px' }}>
        Valores base estimados para os serviços mais solicitados.
      </p>

      {/* Formulário visível apenas quando a costureira está editando */}
      {modoEdicao && (
        <form onSubmit={handleAdicionarPreco} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Nome do Serviço"
            value={novoServico}
            onChange={(e) => setNovoServico(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor (R$)"
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
            required
          />
          <select value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}>
            <option value="Ajustes">Ajustes</option>
            <option value="Consertos">Consertos</option>
            <option value="Confecção">Confecção</option>
          </select>
          <button type="submit" style={{ padding: '8px 14px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            + Adicionar
          </button>
        </form>
      )}

      {/* Tabela de Exibição */}
      {precos.length === 0 ? (
        <p style={{ color: '#888', fontSize: '13px', fontStyle: 'italic' }}>Nenhum preço cadastrado.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#3E2445', color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px' }}>Serviço</th>
              <th style={{ padding: '8px 12px' }}>Categoria</th>
              <th style={{ padding: '8px 12px' }}>Valor Base</th>
              {modoEdicao && <th style={{ padding: '8px 12px', textAlign: 'center' }}>Ação</th>}
            </tr>
          </thead>
          <tbody>
            {precos.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee', background: index % 2 === 0 ? '#FAF7F5' : '#fff' }}>
                <td style={{ padding: '8px 12px' }}>{item.servico}</td>
                <td style={{ padding: '8px 12px' }}>{item.categoria}</td>
                <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#2e7d32' }}>R$ {item.valor.toFixed(2)}</td>
                {modoEdicao && (
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <button onClick={() => handleRemover(item.id)} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                      Excluir
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TabelaPrecos;