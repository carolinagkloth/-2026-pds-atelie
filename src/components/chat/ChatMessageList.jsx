import React, { useState, useRef, useEffect } from 'react';

const obterEstiloStatus = (status) => {
  const s = (status || '').toLowerCase();

  if (s === 'aberto' || s === 'disponível') {
    return { background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32' };
  }
  if (s === 'aguardando prova') {
    return { background: '#FFF3E0', border: '1px solid #FFCC80', color: '#E65100' };
  }
  if (s === 'em produção' || s === 'a fazer') {
    return { background: '#E3F2FD', border: '1px solid #90CAF9', color: '#1565C0' };
  }
  if (s === 'concluído') {
    return { background: '#E0F2F1', border: '1px solid #80CBC4', color: '#00695C' };
  }
  if (s === 'entregue') {
    return { background: '#F3E5F5', border: '1px solid #CE93D8', color: '#6A1B9A' };
  }
  if (s === 'cancelado') {
    return { background: '#FFEBEE', border: '1px solid #EF9A9A', color: '#C62828' };
  }

  return { background: '#F5F5F5', border: '1px solid #E0E0E0', color: '#616161' };
};

function ChatMessageList({
  mensagens,
  idUsuario,
  idPedido,
  tituloChat,
  statusPedido,
  isCostureira,
  onEnviarMensagem,
  onAceitarProposta,
  onRecusarProposta,
  onAceitarProva,
  onRecusarProva
}) {
  const [novaMensagem, setNovaMensagem] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;
    onEnviarMensagem(novaMensagem.trim());
    setNovaMensagem('');
  };

  const formatarDataHeader = (dataStr) => {
    if (!dataStr) return '';
    const d = new Date(dataStr);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);

    if (d.toDateString() === hoje.toDateString()) return 'Hoje';
    if (d.toDateString() === ontem.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR');
  };

  const formatarHoraMsg = (dataStr) => {
    if (!dataStr) return '';
    const d = new Date(dataStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  let ultimaDataHeader = null;
  const contratoAtivo = ['Em Produção', 'Aguardando Prova', 'Concluído', 'Entregue'].includes(statusPedido);
  const pedidoCancelado = statusPedido === 'Cancelado';
  const pedidoEncerrado = ['Cancelado', 'Entregue'].includes(statusPedido);
  const estiloStatus = obterEstiloStatus(statusPedido);

  const temPropostaPendente =
    !contratoAtivo &&
    !pedidoCancelado &&
    mensagens.some((m) => {
      const ehProp = m.tipo_mensagem === 'proposta' || (m.conteudo && m.conteudo.includes('Proposta de Orçamento:'));
      if (!ehProp) return false;
      let dados = m.dados_proposta || {};
      if (typeof dados === 'string') {
        try { dados = JSON.parse(dados); } catch { dados = {}; }
      }
      return (dados.status || 'pendente') !== 'recusada';
    });

  const temProvaPendente =
    !pedidoEncerrado &&
    mensagens.some((m) => {
      const ehProva = m.tipo_mensagem === 'proposta_prova' || (m.conteudo && m.conteudo.includes('Proposta de Agendamento de Prova:'));
      if (!ehProva) return false;
      let dados = m.dados_proposta || {};
      if (typeof dados === 'string') {
        try { dados = JSON.parse(dados); } catch { dados = {}; }
      }
      return (dados.status || 'pendente') === 'pendente';
    });

  return (
    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', display: 'flex', flexDirection: 'column', height: '620px', overflow: 'hidden' }}>
      
      <div style={{ background: '#3E2445', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {tituloChat || `Pedido #${idPedido}`}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {statusPedido && (
            <span
              style={{
                background: estiloStatus.background,
                border: estiloStatus.border,
                color: estiloStatus.color,
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Status: {statusPedido}
            </span>
          )}
          <span style={{ fontSize: '12px', opacity: 0.85 }}>Pedido #{idPedido}</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#FAF7FA', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {mensagens.map((msg, index) => {
          const rawData = msg.data_hora_envio || msg.dataHoraEnvio;
          const dataHeader = formatarDataHeader(rawData);
          const exibirDivisor = dataHeader && dataHeader !== ultimaDataHeader;
          if (exibirDivisor) ultimaDataHeader = dataHeader;

          const ehMinha = Number(msg.id_remetente || msg.idRemetente) === Number(idUsuario);
          const ehProposta = msg.tipo_mensagem === 'proposta' || (msg.conteudo && msg.conteudo.includes('Proposta de Orçamento:'));
          const ehPropostaProva = msg.tipo_mensagem === 'proposta_prova' || (msg.conteudo && msg.conteudo.includes('Proposta de Agendamento de Prova:'));

          let dadosProposta = msg.dados_proposta || {};
          if (typeof dadosProposta === 'string') {
            try { dadosProposta = JSON.parse(dadosProposta); } catch { dadosProposta = {}; }
          }
          const statusCard = dadosProposta.status || 'pendente';

          return (
            <React.Fragment key={msg.id_mensagem || msg.id || index}>
              {exibirDivisor && (
                <div style={{ textAlign: 'center', margin: '15px 0' }}>
                  <span style={{ background: '#E0D0E0', color: '#3E2445', padding: '4px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                    {dataHeader}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: ehMinha ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '80%', background: ehMinha ? '#3E2445' : '#fff', color: ehMinha ? '#fff' : '#333', border: ehMinha ? 'none' : '1px solid #E0D0E0', padding: '12px 16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: ehMinha ? '#EADCEB' : '#777', marginBottom: '4px', fontWeight: 'bold' }}>
                    {msg.remetente_nome || msg.nomeRemetente || (ehMinha ? 'Você' : 'Interlocutor')}
                  </div>

                  <div style={{ fontSize: '14px', whiteSpace: 'pre-line', paddingBottom: '12px' }}>
                    {msg.conteudo}
                  </div>

                  {/* Card de Proposta de Orçamento */}
                  {ehProposta && (
                    <div style={{ marginTop: '8px', background: ehMinha ? 'rgba(255,255,255,0.1)' : '#FAF7FA', padding: '10px', borderRadius: '8px', border: '1px solid rgba(62, 36, 69, 0.2)' }}>
                      {statusCard === 'recusada' ? (
                        <div style={{ background: '#FFEBEE', color: '#C62828', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                          ✕ Orçamento Recusado
                        </div>
                      ) : contratoAtivo ? (
                        <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                          ✓ Orçamento Aprovado (Contrato Ativo)
                        </div>
                      ) : pedidoCancelado ? (
                        <div style={{ background: '#F5F5F5', color: '#616161', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                          Pedido Cancelado (Proposta Encerrada)
                        </div>
                      ) : !isCostureira ? (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button
                            onClick={() => onAceitarProposta(dadosProposta, msg.id_remetente || msg.idRemetente)}
                            style={{ flex: 1, padding: '8px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                          >
                            ✓ Aceitar Orçamento
                          </button>
                          <button
                            onClick={() => onRecusarProposta(msg.id_mensagem || msg.id, msg.id_remetente || msg.idRemetente)}
                            style={{ flex: 1, padding: '8px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                          >
                            ✕ Recusar
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: ehMinha ? '#EADCEB' : '#666', fontStyle: 'italic', textAlign: 'center' }}>
                          Aguardando aprovação da cliente...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card de Proposta de Prova */}
                  {ehPropostaProva && (
                    <div style={{ marginTop: '8px', background: ehMinha ? 'rgba(255,255,255,0.1)' : '#FAF7FA', padding: '10px', borderRadius: '8px', border: '1px solid rgba(62, 36, 69, 0.2)' }}>
                      {statusCard === 'recusada' ? (
                        <div style={{ background: '#FFEBEE', color: '#C62828', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                          ✕ Data de Prova Recusada
                        </div>
                      ) : statusCard === 'aceita' ? (
                        <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                          ✓ Prova Confirmada (Adicionada à Agenda)
                        </div>
                      ) : pedidoEncerrado ? (
                        <div style={{ background: '#F5F5F5', color: '#616161', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                          Pedido Encerrado (Sugestão Inválida)
                        </div>
                      ) : !isCostureira ? (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button
                            onClick={() => onAceitarProva && onAceitarProva(msg.id_mensagem || msg.id, dadosProposta, msg.id_remetente || msg.idRemetente)}
                            style={{ flex: 1, padding: '8px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                          >
                            ✓ Aceitar Prova
                          </button>
                          <button
                            onClick={() => onRecusarProva && onRecusarProva(msg.id_mensagem || msg.id, msg.id_remetente || msg.idRemetente)}
                            style={{ flex: 1, padding: '8px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                          >
                            ✕ Recusar
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: ehMinha ? '#EADCEB' : '#666', fontStyle: 'italic', textAlign: 'center' }}>
                          Aguardando confirmação da cliente...
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: '10px', color: ehMinha ? '#EADCEB' : '#999', textAlign: 'right', marginTop: '4px' }}>
                    {formatarHoraMsg(rawData)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {pedidoCancelado && (
        <div style={{ background: '#FFF8E1', borderTop: '1px solid #FFE082', color: '#6D4C41', padding: '8px 16px', fontSize: '12px', textAlign: 'center' }}>
          <strong>Pedido cancelado:</strong> o chat permanece aberto para vocês combinarem a retirada de peças ou pendências.
        </div>
      )}

      {!isCostureira && temPropostaPendente && (
        <div style={{ background: '#FFF8E1', borderTop: '1px solid #FFE082', color: '#6D4C41', padding: '8px 16px', fontSize: '12px', textAlign: 'center', lineHeight: '1.4' }}>
          <strong>Orçamento recebido:</strong> confira o perfil e as avaliações da costureira antes de aceitar. O Ateliê Entre Linhas apenas facilita o contato e não se responsabiliza pelos serviços combinados.
        </div>
      )}

      {!isCostureira && !temPropostaPendente && temProvaPendente && (
        <div style={{ background: '#FFF8E1', borderTop: '1px solid #FFE082', color: '#6D4C41', padding: '8px 16px', fontSize: '12px', textAlign: 'center', lineHeight: '1.4' }}>
          <strong>Sugestão de prova recebida:</strong> confira a data, o horário e o endereço da costureira acima antes de aceitar.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ padding: '15px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          placeholder={pedidoCancelado ? 'Envie uma mensagem para combinar a retirada ou pendências...' : 'Digite sua mensagem...'}
          style={{ flex: 1, padding: '11px 14px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
        />
        <button type="submit" style={{ padding: '11px 20px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          Enviar
        </button>
      </form>
    </div>
  );
}

export default ChatMessageList;