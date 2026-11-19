import React, { useState, useEffect } from 'react';

const formatarMoeda = (valor) => {
  const num = Number(valor) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarDataSegura = (dataStr) => {
  if (!dataStr) return '';
  if (typeof dataStr === 'string' && dataStr.includes('-')) {
    const [ano, mes, dia] = dataStr.split('T')[0].split('-');
    if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
  }
  const d = new Date(dataStr);
  return isNaN(d.getTime()) ? dataStr : d.toLocaleDateString('pt-BR');
};

function ModalAceitarProposta({
  isOpen,
  onClose,
  onConfirmar,
  dadosProposta,
  orcamentoAtual,
  costureiraNome,
  onVerPerfil,
  enviando
}) {
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErro('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const valorTotal = Number(dadosProposta?.valorTotal ?? orcamentoAtual?.total ?? 0);
  const valorEntrada = Number(dadosProposta?.valorEntrada ?? orcamentoAtual?.entrada ?? 0);
  const previsaoEntrega = dadosProposta?.previsaoEntrega || orcamentoAtual?.prazo || '';
  const horarioEntrega = dadosProposta?.horarioEntrega || orcamentoAtual?.horarioEntrega || '';

  const handleConfirmar = async () => {
    setErro('');
    try {
      await onConfirmar();
    } catch (err) {
      setErro(err.message || 'Não foi possível aprovar o orçamento.');
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
          maxWidth: '500px',
          padding: '26px',
          boxShadow: '0 8px 30px rgba(62, 36, 69, 0.25)',
          fontFamily: "'Segoe UI', Tahoma, sans-serif"
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, color: '#3E2445', fontSize: '19px' }}>
            Confirmar Aceite do Orçamento
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

        {/* Resumo do Orçamento */}
        <div
          style={{
            background: '#FAF6FA',
            border: '1px solid #EADCEB',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '14px',
            fontSize: '13px',
            color: '#333'
          }}
        >
          {costureiraNome && (
            <div style={{ marginBottom: '4px' }}>
              <strong>Costureira:</strong> {costureiraNome}
            </div>
          )}
          <div style={{ marginBottom: '4px' }}>
            <strong>Valor Total:</strong> {formatarMoeda(valorTotal)}
            {valorEntrada > 0 && ` (Entrada/Sinal: ${formatarMoeda(valorEntrada)})`}
          </div>
          {previsaoEntrega && (
            <div>
              <strong>Previsão de Entrega:</strong> {formatarDataSegura(previsaoEntrega)}
              {horarioEntrega ? ` às ${horarioEntrega}` : ''}
            </div>
          )}
        </div>

        {/* Aviso de Atenção e Isenção de Responsabilidade */}
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
            Atenção antes de fechar o serviço
          </strong>
          Ao aceitar este orçamento, você está firmando um acordo diretamente com a costureira. Verifique o{' '}
          <strong>perfil, o portfólio e as avaliações</strong> dela para ter certeza de que é uma profissional de sua confiança.
          <br />
          <span style={{ display: 'block', marginTop: '6px' }}>
            O <strong>Ateliê Entre Linhas</strong> atua apenas como ponte de contato entre clientes e costureiras,{' '}
            <strong>não se responsabilizando</strong> por prazos, qualidade do acabamento, pagamentos combinados ou entrega de peças e tecidos.
          </span>

          {onVerPerfil && (
            <button
              type="button"
              onClick={onVerPerfil}
              disabled={enviando}
              style={{
                marginTop: '10px',
                padding: '6px 12px',
                background: '#fff',
                color: '#3E2445',
                border: '1px solid #3E2445',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              👤 Conferir Perfil e Avaliações da Costureira
            </button>
          )}
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
            {enviando ? 'Confirmando...' : '✓ Estou Ciente e Aceitar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalAceitarProposta;