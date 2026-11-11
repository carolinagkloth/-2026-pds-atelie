import React, { useState } from 'react';

function ModalProposta({ isOpen, onClose, onEnviar, descricaoInicial, tipoInicial }) {
  const [tipoServico, setTipoServico] = useState(tipoInicial || 'Ajuste / Conserto');
  const [descricao, setDescricao] = useState(descricaoInicial || '');
  const [valorTotal, setValorTotal] = useState('R$ 0,00');
  const [valorEntrada, setValorEntrada] = useState('R$ 0,00');
  const [previsaoEntrega, setPrevisaoEntrega] = useState('');
  const [horarioEntrega, setHorarioEntrega] = useState('14:00');

  if (!isOpen) return null;

  const mascararMoeda = (valorRaw) => {
    let v = String(valorRaw).replace(/\D/g, '');
    if (!v) return 'R$ 0,00';
    v = (parseInt(v, 10) / 100).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${v}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!previsaoEntrega || !horarioEntrega) {
      alert('A data e o horário limite de entrega são obrigatórios para formalizar a proposta.');
      return;
    }
    onEnviar({ tipoServico, descricao, valorTotal, valorEntrada, previsaoEntrega, horarioEntrega });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '450px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, color: '#3E2445' }}>Enviar Proposta de Orçamento</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Tipo de Serviço</label>
            <input type="text" value={tipoServico} onChange={(e) => setTipoServico(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Descrição do Serviço</label>
            <textarea rows="3" value={descricao} onChange={(e) => setDescricao(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Valor Total (R$) *</label>
            <input type="text" value={valorTotal} onChange={(e) => setValorTotal(mascararMoeda(e.target.value))} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Valor Entrada / Sinal (R$)</label>
            <input type="text" value={valorEntrada} onChange={(e) => setValorEntrada(mascararMoeda(e.target.value))} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Data Entrega *</label>
              <input type="date" value={previsaoEntrega} onChange={(e) => setPrevisaoEntrega(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Horário Limite *</label>
              <input type="time" value={horarioEntrega} onChange={(e) => setHorarioEntrega(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ padding: '9px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar Proposta</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalProposta;