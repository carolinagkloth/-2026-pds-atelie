import React, { useState } from 'react';

function ModalProva({ isOpen, onClose, onConfirmar }) {
  const [dataProva, setDataProva] = useState('');
  const [horarioProva, setHorarioProva] = useState('14:00');
  const [semPreferenciaHorario, setSemPreferenciaHorario] = useState(false);
  const [observacao, setObservacao] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dataProva) return alert('Selecione a data da prova.');
    onConfirmar({ dataProva, horarioProva, semPreferenciaHorario, observacao });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, color: '#3E2445' }}>Agendar Prova da Peça</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Data da Prova *</label>
            <input type="date" value={dataProva} onChange={(e) => setDataProva(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Horário da Prova</label>
            <input type="time" value={horarioProva} disabled={semPreferenciaHorario} onChange={(e) => setHorarioProva(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', opacity: semPreferenciaHorario ? 0.5 : 1 }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input type="checkbox" checked={semPreferenciaHorario} onChange={(e) => setSemPreferenciaHorario(e.target.checked)} />
              Sem preferência / Horário a combinar
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Observações</label>
            <textarea rows="3" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex: Traga o sapato que usará com a peça..." style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ padding: '9px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Confirmar Agendamento</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalProva;