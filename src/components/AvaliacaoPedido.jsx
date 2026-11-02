import React, { useState } from 'react';

function AvaliacaoPedido({ idOrdemServico, idCliente, onSucesso, onCancelar }) {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const response = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_ordem_servico: idOrdemServico,
          id_cliente: idCliente,
          nota,
          comentario
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao enviar avaliação.');

      alert('Obrigado pela sua avaliação!');
      if (onSucesso) onSucesso();
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #EADCEB', maxWidth: '400px', margin: '15px auto' }}>
      <h3 style={{ color: '#3E2445', marginTop: 0 }}>Avaliar Serviço Concluído</h3>
      {erro && <div style={{ color: '#c62828', fontSize: '13px', marginBottom: '10px' }}>{erro}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}>Nota (1 a 5 estrelas):</label>
          <div style={{ fontSize: '24px', cursor: 'pointer', color: '#FFB400' }}>
            {[1, 2, 3, 4, 5].map((estrela) => (
              <span key={estrela} onClick={() => setNota(estrela)}>
                {estrela <= nota ? '★' : '☆'}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}>Comentário / Depoimento:</label>
          <textarea
            rows="3"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Como ficou a peça e o atendimento da costureira?"
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={carregando} style={{ flex: 1, padding: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {carregando ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
          {onCancelar && (
            <button type="button" onClick={onCancelar} style={{ padding: '10px 15px', background: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default AvaliacaoPedido;