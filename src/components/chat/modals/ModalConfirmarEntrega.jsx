import React, { useState, useEffect } from 'react';

function ModalConfirmarEntrega({ isOpen, onClose, onConfirmar, enviando }) {
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErro('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmar = async () => {
    setErro('');
    try {
      await onConfirmar();
    } catch (err) {
      setErro(err.message || 'Não foi possível confirmar o recebimento.');
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
            Confirmar Recebimento da Peça
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

        <div
          style={{
            background: '#FFF8E1',
            border: '1px solid #FFE082',
            borderLeft: '4px solid #F57C00',
            borderRadius: '8px',
            padding: '13px 14px',
            marginBottom: '18px',
            fontSize: '13px',
            color: '#5D4037',
            lineHeight: '1.5'
          }}
        >
          <strong style={{ display: 'block', color: '#E65100', marginBottom: '5px' }}>
            Atenção antes de confirmar
          </strong>
          Clique em confirmar <strong>apenas se você já recebeu a peça em mãos</strong> e conferiu se está tudo certo. Após essa confirmação, o pedido será encerrado definitivamente como <strong>Entregue</strong> e não poderá mais ser alterado ou reaberto.
          <span style={{ display: 'block', marginTop: '7px' }}>
            O <strong>Ateliê Entre Linhas</strong> atua apenas como ponte de contato entre clientes e costureiras,{' '}
            <strong>não se responsabilizando</strong> pelo acabamento, ajustes posteriores ou acordos combinados entre as partes.
          </span>
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
            type="button"
            onClick={handleConfirmar}
            disabled={enviando}
            style={{
              padding: '9px 18px',
              background: '#2E7D32',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: enviando ? 'not-allowed' : 'pointer',
              opacity: enviando ? 0.7 : 1
            }}
          >
            {enviando ? 'Confirmando...' : '🎉 Sim, Já Recebi a Peça'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmarEntrega;