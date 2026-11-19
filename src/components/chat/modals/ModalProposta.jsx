import React, { useState, useEffect } from 'react';

const parsePrazoCliente = (prazoStr) => {
  if (!prazoStr) {
    return { dataMax: '', horarioMax: '', temHorarioFixo: false };
  }
  const str = String(prazoStr).trim();
  const matchData = str.match(/(\d{4}-\d{2}-\d{2})/);
  const dataMax = matchData ? matchData[1] : '';

  const matchHora = str.match(/\((\d{2}:\d{2})\)/);
  const horarioMax = matchHora ? matchHora[1] : '';

  return {
    dataMax,
    horarioMax,
    temHorarioFixo: Boolean(horarioMax)
  };
};

const formatarDataBR = (yyyyMmDd) => {
  if (!yyyyMmDd) return '';
  const [ano, mes, dia] = yyyyMmDd.split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : yyyyMmDd;
};

function ModalProposta({ isOpen, onClose, onEnviar, descricaoInicial, tipoInicial, prazoDesejado }) {
  const [tipoServico, setTipoServico] = useState(tipoInicial || 'Ajuste / Conserto');
  const [descricao, setDescricao] = useState(descricaoInicial || '');
  const [valorTotal, setValorTotal] = useState('R$ 0,00');
  const [valorEntrada, setValorEntrada] = useState('R$ 0,00');
  const [previsaoEntrega, setPrevisaoEntrega] = useState('');
  const [horarioEntrega, setHorarioEntrega] = useState('14:00');
  const [erro, setErro] = useState('');

  const agora = new Date();
  const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;

  const { dataMax, horarioMax, temHorarioFixo } = parsePrazoCliente(prazoDesejado);
  const prazoClienteVencido = Boolean(dataMax && dataMax < hoje);

  useEffect(() => {
    if (isOpen) {
      setTipoServico(tipoInicial || 'Ajuste / Conserto');
      setDescricao(descricaoInicial || '');
      setValorTotal('R$ 0,00');
      setValorEntrada('R$ 0,00');
      setPrevisaoEntrega(dataMax && dataMax >= hoje ? dataMax : '');
      setHorarioEntrega(horarioMax || '14:00');
      setErro('');
    }
  }, [isOpen, tipoInicial, descricaoInicial, dataMax, horarioMax, hoje]);

  if (!isOpen) return null;

  const mascararMoeda = (valorRaw) => {
    let v = String(valorRaw).replace(/\D/g, '');
    if (!v) return 'R$ 0,00';
    v = (parseInt(v, 10) / 100).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${v}`;
  };

  const handleDataChange = (novaData) => {
    setPrevisaoEntrega(novaData);
    // Se voltar para a data limite da cliente e o horário escolhido passar do limite, ajusta automaticamente
    if (temHorarioFixo && novaData === dataMax && horarioEntrega > horarioMax) {
      setHorarioEntrega(horarioMax);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');

    const totalNumerico = parseFloat(valorTotal.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    if (totalNumerico <= 0) {
      setErro('Informe um valor total maior que R$ 0,00 para enviar o orçamento.');
      return;
    }

    if (!previsaoEntrega || !horarioEntrega) {
      setErro('A data e o horário limite de entrega são obrigatórios para formalizar a proposta.');
      return;
    }

    if (!prazoClienteVencido && dataMax && previsaoEntrega > dataMax) {
      setErro(`A data de entrega não pode ultrapassar o prazo solicitado pela cliente (${formatarDataBR(dataMax)}).`);
      return;
    }

    if (!prazoClienteVencido && temHorarioFixo && previsaoEntrega === dataMax && horarioEntrega > horarioMax) {
      setErro(`Para entrega no dia ${formatarDataBR(dataMax)}, o horário limite solicitado pela cliente é até ${horarioMax}.`);
      return;
    }

    onEnviar({ tipoServico, descricao, valorTotal, valorEntrada, previsaoEntrega, horarioEntrega });
  };

  const limiteHorarioAtivo = !prazoClienteVencido && temHorarioFixo && previsaoEntrega === dataMax;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(30, 18, 34, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '15px' }}>
      <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '460px', maxWidth: '100%', boxShadow: '0 8px 30px rgba(62, 36, 69, 0.25)', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
        <h3 style={{ marginTop: 0, marginBottom: '14px', color: '#3E2445' }}>Enviar Proposta de Orçamento</h3>

        {dataMax && (
          <div
            style={{
              background: '#FAF6FA',
              border: '1px solid #EADCEB',
              borderLeft: '4px solid #3E2445',
              borderRadius: '6px',
              padding: '10px 12px',
              marginBottom: '14px',
              fontSize: '12.5px',
              color: '#3E2445',
              lineHeight: '1.4'
            }}
          >
            <strong>Prazo solicitado pela cliente:</strong> {formatarDataBR(dataMax)}
            {temHorarioFixo ? ` até às ${horarioMax}` : ' (horário a combinar)'}
            <span style={{ display: 'block', color: '#666', marginTop: '2px' }}>
              {prazoClienteVencido
                ? 'A data original já passou; selecione a data mais próxima disponível.'
                : 'Você pode manter esse prazo ou adiantar a entrega.'}
            </span>
          </div>
        )}

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Data Entrega *</label>
              <input
                type="date"
                min={hoje}
                max={!prazoClienteVencido && dataMax ? dataMax : undefined}
                value={previsaoEntrega}
                onChange={(e) => handleDataChange(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Horário Limite *</label>
              <input
                type="time"
                max={limiteHorarioAtivo ? horarioMax : undefined}
                value={horarioEntrega}
                onChange={(e) => setHorarioEntrega(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                required
              />
            </div>
          </div>

          {erro && (
            <div style={{ background: '#FFEBEE', color: '#C62828', padding: '9px 12px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '12px' }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ padding: '9px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar Proposta</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalProposta;