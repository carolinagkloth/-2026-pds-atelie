import React, { useState } from 'react';

const OPCOES_COM_SINAL = [
  'Aguardando Sinal',
  'Sinal Pago',
  'Aguardando Restante',
  'Pago Integralmente',
  'Em Débito'
];

const OPCOES_SEM_SINAL = [
  'Aguardando Valor Total',
  'Pago Integralmente',
  'Em Débito'
];

const ORDEM_ETAPA = {
  'Aguardando Sinal': 1,
  'Aguardando Valor Total': 1,
  'Sinal Pago': 2,
  'Aguardando Restante': 2,
  'Em Débito': 2,
  'Pago Integralmente': 3
};

const podeAvancarPara = (statusAtual, destino) => {
  if (destino === statusAtual) return false;
  if (statusAtual === 'Pago Integralmente') return false;

  const nivelAtual = ORDEM_ETAPA[statusAtual] || 1;
  const nivelDestino = ORDEM_ETAPA[destino] || 1;

  if (destino === 'Em Débito') return true;
  if (statusAtual === 'Em Débito' && destino === 'Aguardando Sinal') return false;

  return nivelDestino >= nivelAtual;
};

const obterEstiloPagamento = (status) => {
  if (status === 'Pago Integralmente') {
    return { background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32' };
  }
  if (status === 'Sinal Pago' || status === 'Aguardando Restante') {
    return { background: '#E3F2FD', border: '1px solid #90CAF9', color: '#1565C0' };
  }
  if (status === 'Em Débito') {
    return { background: '#FFEBEE', border: '1px solid #EF9A9A', color: '#C62828' };
  }
  return { background: '#FFF8E1', border: '1px solid #FFE082', color: '#E65100' };
};

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const calcularRestante = (total, entrada, statusAtual) => {
  if (statusAtual === 'Pago Integralmente') return 0;
  if (statusAtual === 'Sinal Pago' || statusAtual === 'Aguardando Restante') {
    return Math.max(total - entrada, 0);
  }
  return total;
};

function CardStatusPagamento({
  statusPedido,
  statusPagamento,
  valorTotal,
  valorEntrada,
  isCostureira,
  onAlterarPagamento
}) {
  const [atualizando, setAtualizando] = useState(false);
  const [statusPendenteConfirmacao, setStatusPendenteConfirmacao] = useState(null);

  const pedidoAceito = ['Em Produção', 'Aguardando Prova', 'Concluído', 'Entregue'].includes(statusPedido);
  if (!pedidoAceito) return null;

  const total = Number(valorTotal || 0);
  const entrada = Number(valorEntrada || 0);
  const temSinal = entrada > 0;

  const opcoesDisponiveis = temSinal ? OPCOES_COM_SINAL : OPCOES_SEM_SINAL;
  const statusAtual = opcoesDisponiveis.includes(statusPagamento)
    ? statusPagamento
    : (temSinal ? 'Aguardando Sinal' : 'Aguardando Valor Total');

  const restante = calcularRestante(total, entrada, statusAtual);
  const estilo = obterEstiloPagamento(statusAtual);

  const confirmarAlteracao = async () => {
    if (!statusPendenteConfirmacao || atualizando) return;
    setAtualizando(true);
    try {
      await onAlterarPagamento(statusPendenteConfirmacao);
      setStatusPendenteConfirmacao(null);
    } finally {
      setAtualizando(false);
    }
  };

  return (
    <>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#3E2445', fontSize: '17px' }}>
          Status do Pagamento
        </h3>

        {/* Badge do Status Atual (Visível para Profissional e Cliente) */}
        <div style={{ background: estilo.background, border: estilo.border, borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '2px' }}>
            Situação Atual:
          </span>
          <strong style={{ color: estilo.color, fontSize: '14px' }}>
            {statusAtual}
          </strong>
        </div>

        {/* Resumo dos Valores do Orçamento */}
        <div style={{ background: '#FAF6FA', border: '1px solid #EADCEB', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px', color: '#444', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Valor Total:</span>
            <strong style={{ color: '#3E2445' }}>{formatarMoeda(total)}</strong>
          </div>

          {temSinal && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sinal / Entrada:</span>
              <strong>{formatarMoeda(entrada)}</strong>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #D8C7DA', marginTop: '4px', paddingTop: '4px' }}>
            <span>Restante a Pagar:</span>
            <strong style={{ color: restante === 0 ? '#2E7D32' : '#3E2445' }}>
              {formatarMoeda(restante)}
            </strong>
          </div>
        </div>

        {/* Botões de Controle (Visíveis APENAS para quem presta o serviço) */}
        {isCostureira && (
          <div style={{ marginTop: '14px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
            <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>
              Atualizar pagamento:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {opcoesDisponiveis.map((opcao) => {
                const ativo = opcao === statusAtual;
                const permitido = podeAvancarPara(statusAtual, opcao);
                const bloqueado = !ativo && !permitido;

                return (
                  <button
                    key={opcao}
                    type="button"
                    disabled={ativo || bloqueado || atualizando}
                    onClick={() => setStatusPendenteConfirmacao(opcao)}
                    title={bloqueado ? 'Não é possível retornar para uma etapa anterior.' : ''}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: ativo || bloqueado ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: ativo ? '#3E2445' : (bloqueado ? '#F5F5F5' : '#F4EFF5'),
                      color: ativo ? '#fff' : (bloqueado ? '#9E9E9E' : '#3E2445'),
                      border: ativo ? '1px solid #3E2445' : (bloqueado ? '1px solid #E0E0E0' : '1px solid #D8C7DA'),
                      opacity: bloqueado ? 0.65 : 1
                    }}
                  >
                    <span>{opcao}</span>
                    {ativo && <span>Atual</span>}
                    {bloqueado && <span style={{ fontSize: '10.5px', fontWeight: 'normal' }}>Bloqueado</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Alteração de Pagamento */}
      {statusPendenteConfirmacao && (
        <div
          onClick={() => !atualizando && setStatusPendenteConfirmacao(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1600,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '430px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', color: '#3E2445', fontSize: '18px' }}>
              Confirmar Atualização de Pagamento
            </h3>

            <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: '#444', lineHeight: '1.5' }}>
              Você está prestes a alterar o status financeiro deste pedido de{' '}
              <strong>{statusAtual}</strong> para{' '}
              <strong style={{ color: '#3E2445' }}>{statusPendenteConfirmacao}</strong>.
            </p>

            <div
              style={{
                background: '#FFF8E1',
                border: '1px solid #FFE082',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12.5px',
                color: '#5D4037',
                lineHeight: '1.5',
                marginBottom: '18px'
              }}
            >
              <strong>Aviso importante:</strong> Esta ferramenta é destinada apenas ao controle e organização de quem presta o serviço de costura, pois os pagamentos são combinados diretamente fora da plataforma. Após confirmar, não será possível retornar para etapas anteriores e o/a cliente será notificado(a) no chat.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={atualizando}
                onClick={() => setStatusPendenteConfirmacao(null)}
                style={{
                  padding: '9px 16px',
                  background: '#EEE',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={atualizando}
                onClick={confirmarAlteracao}
                style={{
                  padding: '9px 16px',
                  background: '#3E2445',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {atualizando ? 'Salvando...' : 'Confirmar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CardStatusPagamento;