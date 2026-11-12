import React from 'react';
import { exportarPDF, exportarTXT, formatarDataBR } from './utils/chatExport';

function ChatSidebar({
  orcamentoAtual,
  isCostureira,
  idCostureiraPedido,
  costureiraNome,
  clienteNome,
  medidas,
  pedido,
  idPedido,
  jaAvaliado,
  onOpenProposta,
  onOpenProva,
  onConcluirServico,
  onConfirmarEntrega,
  onOpenAvaliacao,
  onCancelarPedido,
  onOpenMedidas,
  onNavigate
}) {
  const contratoAtivo = ['Em Produção', 'Aguardando Prova', 'Concluído', 'Entregue'].includes(orcamentoAtual.status);
  const pedidoFinalizado = ['Cancelado', 'Entregue'].includes(orcamentoAtual.status);
  const podeEnviarProposta = isCostureira && !contratoAtivo && !pedidoFinalizado;
  const nomeCostureiraExibir = costureiraNome || pedido?.costureiraNome || 'Não informada';
  const nomeClienteExibir = clienteNome || pedido?.clienteNome || pedido?.nomeCliente || 'Cliente';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Status & Detalhes do Pedido */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#3E2445', fontSize: '17px' }}>Status do Pedido</h3>
        
        <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '2px' }}>Status Atual:</span>
          <strong style={{ color: '#E65100', fontSize: '14px' }}>{orcamentoAtual.status}</strong>
        </div>

        {/* EXIBIÇÃO CONDICIONAL: NOME DO CLIENTE (para costureira) OU COSTUREIRA (para cliente) */}
        {isCostureira ? (
          <div style={{ background: '#FAF6FA', border: '1px solid #EADCEB', borderRadius: '8px', padding: '12px', marginBottom: '15px' }}>
            <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold', display: 'block' }}>
              Cliente:
            </span>
            <strong style={{ color: '#3E2445', fontSize: '14px', display: 'block', marginTop: '2px' }}>
              {nomeClienteExibir}
            </strong>
          </div>
        ) : (
          <div style={{ background: '#FAF6FA', border: '1px solid #EADCEB', borderRadius: '8px', padding: '12px', marginBottom: '15px' }}>
            <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold', display: 'block' }}>
              Costureira Responsável:
            </span>
            <strong style={{ color: '#3E2445', fontSize: '14px', display: 'block', marginTop: '2px' }}>
              {nomeCostureiraExibir}
            </strong>
          </div>
        )}

        {/* Botão de Perfil Público da Costureira (Visível apenas para a Cliente) */}
        {!isCostureira && idCostureiraPedido && (
          <button
            onClick={() => onNavigate && onNavigate('portfolio', idCostureiraPedido)}
            style={{ width: '100%', padding: '9px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', cursor: 'pointer' }}
          >
            👤 Ver Perfil da Costureira
          </button>
        )}

        {/* Previsão de Entrega */}
        {orcamentoAtual.prazo && (
          <div style={{ marginBottom: '15px', fontSize: '12px', color: '#555' }}>
            <strong>Prazo de Entrega:</strong> {formatarDataBR(orcamentoAtual.prazo)} {orcamentoAtual.horarioEntrega ? `às ${orcamentoAtual.horarioEntrega}` : ''}
          </div>
        )}

        {podeEnviarProposta && (
          <button onClick={onOpenProposta} style={{ width: '100%', padding: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px', cursor: 'pointer' }}>
            + Enviar Orçamento
          </button>
        )}

        {/* Botões da Costureira (ocultos após Entregue ou Cancelado) */}
        {isCostureira && !pedidoFinalizado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={onOpenProva} style={{ width: '100%', padding: '9px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
              Agendar Prova da Peça
            </button>
            <button onClick={onConcluirServico} style={{ width: '100%', padding: '9px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
              ✅ Concluir Peça (Pronto p/ Entrega)
            </button>
          </div>
        )}

        {/* Confirmação de Recebimento pela Cliente */}
        {!isCostureira && orcamentoAtual.status === 'Concluído' && (
          <button onClick={onConfirmarEntrega} style={{ width: '100%', padding: '10px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', marginTop: '10px', cursor: 'pointer' }}>
            🎉 Confirmar Recebimento da Peça
          </button>
        )}

        {/* Botão de Avaliação Posterior (Visível para a Cliente se Entregue e ainda não avaliado) */}
        {!isCostureira && orcamentoAtual.status === 'Entregue' && !jaAvaliado && (
          <button
            onClick={onOpenAvaliacao}
            style={{ width: '100%', padding: '10px', background: '#FFB400', color: '#3E2445', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', marginTop: '10px', cursor: 'pointer' }}
          >
            ⭐ Avaliar Serviço da Costureira
          </button>
        )}

        {!pedidoFinalizado && (
          <button onClick={onCancelarPedido} style={{ width: '100%', padding: '9px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', marginTop: '10px', cursor: 'pointer' }}>
            ❌ {isCostureira ? 'Cancelar / Desistir do Pedido' : 'Cancelar Pedido'}
          </button>
        )}

        {/* Exportações */}
        <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => exportarPDF({ idPedido, orcamentoAtual, medidas, pedido, costureiraNome: nomeCostureiraExibir })} style={{ width: '100%', padding: '8px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
            📄 Exportar PDF (Contrato/Comprovante)
          </button>
          <button onClick={() => exportarTXT({ idPedido, orcamentoAtual, medidas, pedido, costureiraNome: nomeCostureiraExibir })} style={{ width: '100%', padding: '8px', background: '#fff', color: '#555', border: '1px solid #ccc', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
            📝 Baixar Ficha e Orçamento (TXT)
          </button>
        </div>
      </div>

      {/* Ficha de Medidas */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#3E2445', fontSize: '16px' }}>Ficha de Medidas</h3>
          <button onClick={onOpenMedidas} style={{ background: 'none', border: 'none', color: '#3E2445', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Editar</button>
        </div>
        <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: 0, fontSize: '13px', color: '#555' }}>
          <li>Busto: {medidas.busto || '-'} cm</li>
          <li>Cintura: {medidas.cintura || '-'} cm</li>
          <li>Quadril: {medidas.quadril || '-'} cm</li>
        </ul>
      </div>

    </div>
  );
}

export default ChatSidebar;