import React, { useState } from 'react';

function ModalAvaliacao({ isOpen, onClose, onEnviar, onSalvar, onSubmit, carregando = false }) {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');

  if (!isOpen) return null;

  const callbackEnvio = onEnviar || onSalvar || onSubmit;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!carregando && typeof callbackEnvio === 'function') {
      callbackEnvio({ nota, comentario });
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
      <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '420px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, color: '#3E2445' }}>Avaliar Serviço da Costureira</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px', textAlign: 'center' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Sua Nota (1 a 5 estrelas)</label>
            <div style={{ fontSize: '30px', color: '#FFB400', cursor: carregando ? 'default' : 'pointer', userSelect: 'none' }}>
              {[1, 2, 3, 4, 5].map((estrela) => (
                <span key={estrela} onClick={() => !carregando && setNota(estrela)}>
                  {estrela <= nota ? '★' : '☆'}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Comentário / Depoimento</label>
            <textarea
              rows="4"
              disabled={carregando}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte como foi o atendimento e o acabamento..."
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" disabled={carregando} onClick={onClose} style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={carregando} style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: carregando ? 0.7 : 1 }}>
              {carregando ? 'Enviando...' : 'Enviar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalAvaliacao;