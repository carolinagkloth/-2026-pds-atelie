import React, { useState, useEffect } from 'react';

function ModalCancelarPedido({ isOpen, onClose, onConfirmar, isCostureira, enviando }) {
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setObservacao('');
      setErro('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmar = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      await onConfirmar(observacao);
    } catch (err) {
      setErro(err.message || 'Não foi possível cancelar o pedido.');
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
          <h3 style={{ margin: 0, color: '#C62828', fontSize: '19px' }}>
            {isCostureira ? 'Cancelar / Desistir do Pedido' : 'Cancelar Pedido'}
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

        {/* Aviso de Isenção de Responsabilidade da Plataforma */}
        <div
          style={{
            background: '#FFF8E1',
            border: '1px solid #FFE082',
            borderLeft: '4px solid #F57C00',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#5D4037',
            lineHeight: '1.5'
          }}
        >
          <strong style={{ display: 'block', color: '#E65100', marginBottom: '4px' }}>
            Aviso Importante da Plataforma
          </strong>
          O <strong>Ateliê Entre Linhas</strong> atua apenas como ponte de contato entre clientes e profissionais de costura,{' '}
          <strong>não se responsabilizando</strong> por acordos combinados diretamente entre as partes, entregas de materiais, prazos, valores ou eventuais imprevistos decorrentes do cancelamento.
        </div>

        <form onSubmit={handleConfirmar}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#3E2445',
              marginBottom: '6px'
            }}
          >
            Observação ou motivo do cancelamento <span style={{ fontWeight: 'normal', color: '#777' }}>(opcional)</span>
          </label>
          <textarea
            rows="3"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            disabled={enviando}
            placeholder={
              isCostureira
                ? 'Ex.: Não foi possível prosseguir pois o tecido necessário não foi entregue no prazo combinado...'
                : 'Ex.: Precisei cancelar por um imprevisto pessoal ou falta de retorno sobre o ajuste...'
            }
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '13px',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          <span style={{ display: 'block', fontSize: '11.5px', color: '#666', marginTop: '5px', marginBottom: '16px' }}>
            Se você preencher este campo, a mensagem será enviada diretamente para{' '}
            <strong>{isCostureira ? 'o/a cliente' : 'o(a) profissional de costura'}</strong> no chat e na notificação.
          </span>

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
              {enviando ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalCancelarPedido;