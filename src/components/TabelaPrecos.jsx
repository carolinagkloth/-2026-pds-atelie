import React, { useState, useEffect } from 'react';

function TabelaPrecos({ idCostureira, modoEdicao = false }) {
  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const idEfetivo = idCostureira || usuarioSalvo?.id_usuario || usuarioSalvo?.id;

  const [precos, setPrecos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [novoServico, setNovoServico] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('Ajustes');

  useEffect(() => {
    if (!idEfetivo) {
      setCarregando(false);
      return;
    }

    setCarregando(true);
    fetch(`/api/usuarios/${idEfetivo}/tabela-precos`)
      .then((res) => res.json())
      .then((data) => {
        setPrecos(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Erro ao buscar tabela de preços:', err))
      .finally(() => setCarregando(false));
  }, [idEfetivo]);

  const handleAdicionarPreco = async (e) => {
    e.preventDefault();
    if (!novoServico.trim() || !novoValor || !idEfetivo) return;

    setSalvando(true);
    try {
      const response = await fetch(`/api/usuarios/${idEfetivo}/tabela-precos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servico: novoServico.trim(),
          valor: parseFloat(novoValor),
          categoria: novaCategoria
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao adicionar preço.');
      }

      setPrecos((prev) => [...prev, data]);
      setNovoServico('');
      setNovoValor('');
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const handleRemover = async (idPreco) => {
    if (!window.confirm('Deseja realmente remover este serviço da tabela de preços?')) return;

    try {
      const response = await fetch(`/api/tabela-precos/${idPreco}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.erro || 'Erro ao excluir item.');
      }

      setPrecos((prev) => prev.filter((p) => (p.id_preco || p.id) !== idPreco));
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
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
            min="0"
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
          <button
            type="submit"
            disabled={salvando}
            style={{ padding: '8px 14px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            {salvando ? 'Salvando...' : '+ Adicionar'}
          </button>
        </form>
      )}

      {/* Tabela de Exibição */}
      {carregando ? (
        <p style={{ color: '#888', fontSize: '13px' }}>Carregando tabela de preços...</p>
      ) : precos.length === 0 ? (
        <p style={{ color: '#888', fontSize: '13px', fontStyle: 'italic' }}>
          Nenhum preço cadastrado. {modoEdicao ? 'Use o formulário acima para adicionar seus valores.' : 'Clique em "Editar Perfil" para cadastrar seus valores.'}
        </p>
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
            {precos.map((item, index) => {
              const idItem = item.id_preco || item.id;
              return (
                <tr key={idItem} style={{ borderBottom: '1px solid #eee', background: index % 2 === 0 ? '#FAF7F5' : '#fff' }}>
                  <td style={{ padding: '8px 12px' }}>{item.servico}</td>
                  <td style={{ padding: '8px 12px' }}>{item.categoria}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#2e7d32' }}>
                    R$ {Number(item.valor || 0).toFixed(2)}
                  </td>
                  {modoEdicao && (
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemover(idItem)}
                        style={{ background: '#c62828', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        Excluir
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TabelaPrecos;