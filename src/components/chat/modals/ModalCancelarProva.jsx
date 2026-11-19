import React, { useState, useEffect } from 'react';

const formatarDataBR = (yyyyMmDd) => {
  if (!yyyyMmDd) return '';
  if (typeof yyyyMmDd === 'string' && yyyyMmDd.includes('-')) {
    const [ano, mes, dia] = yyyyMmDd.split('T')[0].split('-');
    if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
  }
  const d = new Date(yyyyMmDd);
  return isNaN(d.getTime()) ? yyyyMmDd : d.toLocaleDateString('pt-BR');
};

function ModalCancelarProva({ isOpen, onClose, onConfirmar, provaAgendada, isCostureira, enviando }) {
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setObservacao('');
      setErro('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dataFormatada = formatarDataBR(provaAgendada?.dataProva);
  const horarioTexto = provaAgendada?.semPreferenciaHorario
    ? 'Horário a combinar'
    : (provaAgendada?.horarioProva || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      await onConfirmar(observacao.trim());
    } catch (err) {
      setErro(err.message || 'Não foi possível cancelar a prova.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(30, 18, 34, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '15px'
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '480px',
          padding: '26px',
          boxShadow: '0 8px 30px rgba(62, 36, 69, 0.25)',
          fontFamily: "'Segoe UI', Tahoma, sans-serif"
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, color: '#3E2445', fontSize: '19px' }}>
            Cancelar Prova Agendada
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            style={{ background: 'none', border: 'none', fontSize: '20px', color: '#777', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {/* Resumo do Agendamento */}
        {dataFormatada && (
          <div
            style={{
              background: '#FAF6FA',
              border: '1px solid #EADCEB',
              borderRadius: '8px',
              padding: '11px 14px',
              marginBottom: '14px',
              fontSize: '13px',
              color: '#333'
            }}
          >
            <div>
              <strong>Data da Prova:</strong> {dataFormatada}
              {horarioTexto ? ` (${horarioTexto})` : ''}
            </div>
            {provaAgendada?.local && (
              <div style={{ marginTop: '4px' }}>
                <strong>Local:</strong> {provaAgendada.local}
              </div>
            )}
          </div>
        )}

        {/* Aviso de Isenção de Responsabilidade */}
        <div
          style={{
            background: '#FFF8E1',
            border: '1px solid #FFE082',
            borderLeft: '4px solid #F57C00',
            borderRadius: '8px',
            padding: '13px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#5D4037',
            lineHeight: '1.5'
          }}
        >
          <strong style={{ display: 'block', color: '#E65100', marginBottom: '5px' }}>
            Atenção ao cancelar o agendamento
          </strong>
          Ao confirmar, esta prova será removida da agenda e {isCostureira ? 'a cliente' : 'a costureira'} será notificada para que vocês possam alinhar uma nova data pelo chat.
          <span style={{ display: 'block', marginTop: '7px' }}>
            O <strong>Ateliê Entre Linhas</strong> atua apenas como ponte de contato entre clientes e costureiras,{' '}
            <strong>não se responsabilizando</strong> por agendamentos, comparecimentos, atrasos ou acordos combinados entre as partes.
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '5px' }}>
              Motivo ou observação (opcional)
            </label>
            <textarea
              rows="3"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Tive um imprevisto nesse horário, podemos remarcar para amanhã?"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                boxSizing: 'border-box',
                fontSize: '13px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {erro && (
            <div style={{ background: '#FFEBEE', color: '#C62828', padding: '9px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              style={{
                padding: '9px 16px',
                background: '#F5F5F5',
                color: '#444',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={enviando}
              style={{
                padding: '9px 18px',
                background: '#C62828',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: enviando ? 'not-allowed' : 'pointer',
                opacity: enviando ? 0.7 : 1
              }}
            >
              {enviando ? 'Cancelando...' : 'Confirmar Cancelamento da Prova'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalCancelarProva;