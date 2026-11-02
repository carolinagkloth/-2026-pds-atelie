import React, { useState, useEffect } from 'react';

function Chat({ pedido, usuario, onNavigate }) {
  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const user = usuario && Object.keys(usuario).length > 0 ? usuario : usuarioSalvo;
  const idUsuario = user?.id_usuario || user?.id;
  const nomeUsuario = user?.nome || 'Usuário';
  const isCostureira = (user?.tipo_usuario || user?.tipoUsuario || '').toString().toLowerCase() === 'costureira';

  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [mostrarModalProposta, setMostrarModalProposta] = useState(false);
  const [mostrarModalMedidas, setMostrarModalMedidas] = useState(false);
  const [mostrarModalProva, setMostrarModalProva] = useState(false);

  const [formProva, setFormProva] = useState({ dataProva: '', observacao: '' });

  const [orcamentoAtual, setOrcamentoAtual] = useState({
    total: 0,
    entrada: 0,
    prazo: '',
    status: pedido?.status || 'Pendente',
    descricao: ''
  });

  const [medidas, setMedidas] = useState({
    busto: '',
    cintura: '',
    quadril: '',
    altura: '',
    comprimento: '',
    observacoes_medidas: ''
  });

  const [propostaForm, setPropostaForm] = useState({
    descricao: '',
    valorTotal: '',
    valorEntrada: '',
    previsaoEntrega: ''
  });

  const idPedido = pedido?.id || pedido?.id_pedido;
  const idClientePedido = pedido?.clienteId || (isCostureira ? null : idUsuario);

  useEffect(() => {
    if (idPedido) {
      carregarMensagens();
    }
    carregarMedidasCliente();
  }, [idPedido, idClientePedido]);

  const carregarMedidasCliente = () => {
    const targetId = idClientePedido || idUsuario;
    if (!targetId) return;

    fetch(`/api/usuarios/${targetId}/medidas`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.erro) {
          setMedidas({
            busto: data.busto || '',
            cintura: data.cintura || '',
            quadril: data.quadril || '',
            altura: data.altura || '',
            comprimento: data.comprimento || '',
            observacoes_medidas: data.observacoes_medidas || ''
          });
        }
      })
      .catch(() => {});
  };

  const salvarMedidasCliente = async () => {
    const targetId = idClientePedido || idUsuario;
    if (!targetId) return;

    try {
      const response = await fetch(`/api/usuarios/${targetId}/medidas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medidas)
      });
      if (response.ok) {
        alert('Medidas salvas com sucesso!');
        setMostrarModalMedidas(false);
      }
    } catch (err) {
      alert(`Erro ao salvar medidas: ${err.message}`);
    }
  };

  const carregarMensagens = () => {
    fetch(`/api/mensagens-chat/${idPedido}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMensagens(data);

          const propostaExistente = [...data].reverse().find(
            (m) => m.tipo_mensagem === 'proposta' || (m.conteudo && m.conteudo.includes('Proposta de Orçamento:'))
          );

          if (propostaExistente) {
            let dados = propostaExistente.dados_proposta || {};
            if (typeof dados === 'string') {
              try { dados = JSON.parse(dados); } catch { dados = {}; }
            }

            setOrcamentoAtual({
              total: dados.valorTotal || 0,
              entrada: dados.valorEntrada || 0,
              prazo: dados.previsaoEntrega || pedido?.prazoDesejado || '',
              status: pedido?.status || 'Aguardando Aprovação',
              descricao: dados.descricaoServico || ''
            });
          }
        }
      })
      .catch(() => {});
  };

  const handleAgendarProva = async (e) => {
    e.preventDefault();
    if (!formProva.dataProva) {
      alert('Selecione uma data para a prova!');
      return;
    }

    try {
      const response = await fetch('/api/ordens-servico/agendar-prova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: idPedido,
          id_costureira: idUsuario,
          dataProva: formProva.dataProva,
          observacao: formProva.observacao
        })
      });

      if (response.ok) {
        alert('Prova da peça agendada com sucesso!');
        setMostrarModalProva(false);
        setOrcamentoAtual((prev) => ({ ...prev, status: 'Aguardando Prova' }));
        carregarMensagens();
      } else {
        const data = await response.json();
        alert(data.erro || 'Erro ao agendar prova.');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    try {
      const response = await fetch('/api/mensagens-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_remetente: Number(idUsuario),
          conteudo: novaMensagem.trim(),
          tipo_mensagem: 'texto'
        })
      });

      if (response.ok) {
        setNovaMensagem('');
        carregarMensagens();
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleEnviarProposta = async (e) => {
    e.preventDefault();
    const total = parseFloat(propostaForm.valorTotal);
    if (isNaN(total) || total <= 0) {
      alert('Informe um valor total válido.');
      return;
    }

    const entrada = propostaForm.valorEntrada ? parseFloat(propostaForm.valorEntrada) : 0;
    const textoFormatado = `Proposta de Orçamento:\nServiço: ${propostaForm.descricao}\nValor Total: R$ ${total.toFixed(2)}${entrada > 0 ? `\nEntrada (Sinal): R$ ${entrada.toFixed(2)}` : ''}\nPrevisão de Entrega: ${propostaForm.previsaoEntrega ? new Date(propostaForm.previsaoEntrega).toLocaleDateString('pt-BR') : 'A combinar'}`;

    try {
      const response = await fetch('/api/mensagens-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_remetente: Number(idUsuario),
          conteudo: textoFormatado,
          tipo_mensagem: 'proposta',
          valor_entrada: entrada,
          valor_proposta: total,
          dados_proposta: {
            descricaoServico: propostaForm.descricao,
            valorTotal: total,
            valorEntrada: entrada,
            previsaoEntrega: propostaForm.previsaoEntrega,
            idCostureira: idUsuario
          }
        })
      });

      if (response.ok) {
        setMostrarModalProposta(false);
        carregarMensagens();
        alert('Proposta enviada!');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleAceitarProposta = async (dadosProposta, idRemetenteProposta) => {
    const idCostureira = dadosProposta.idCostureira || idRemetenteProposta || pedido?.costureiraId;

    try {
      const response = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: idPedido,
          id_costureira: idCostureira,
          valor_total: dadosProposta.valorTotal || orcamentoAtual.total,
          valor_entrada: dadosProposta.valorEntrada || orcamentoAtual.entrada,
          previsao_entrega: dadosProposta.previsaoEntrega || orcamentoAtual.prazo
        })
      });

      if (response.ok) {
        alert('Orçamento aprovado! O pedido iniciou em Produção.');
        setOrcamentoAtual((prev) => ({ ...prev, status: 'Em Produção' }));
        if (onNavigate) onNavigate('meusPedidos');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '20px 25px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: '#3E2445', margin: 0, fontSize: '22px' }}>Chat de Negociação</h2>
          <span style={{ fontSize: '13px', color: '#666', marginTop: '4px', display: 'block' }}>
            Usuário: <strong>{nomeUsuario}</strong> ({isCostureira ? 'Costureira' : 'Cliente'})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onNavigate && onNavigate('meusChats')} style={{ padding: '9px 16px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
            Conversas
          </button>
          <button onClick={() => onNavigate && onNavigate(isCostureira ? 'feedPedidos' : 'meusPedidos')} style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
            Ver Pedidos
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        
        {/* Chat */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', display: 'flex', flexDirection: 'column', height: '620px', overflow: 'hidden' }}>
          <div style={{ background: '#3E2445', color: '#fff', padding: '15px 20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Atendimento Direto</h3>
          </div>

          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#FAF7FA', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mensagens.map((msg) => {
              const ehMinha = Number(msg.id_remetente) === Number(idUsuario);
              const ehProposta = msg.tipo_mensagem === 'proposta' || (msg.conteudo && msg.conteudo.includes('Proposta de Orçamento:'));

              return (
                <div key={msg.id_mensagem || msg.id} style={{ display: 'flex', justifyContent: ehMinha ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '80%', background: ehMinha ? '#3E2445' : '#fff', color: ehMinha ? '#fff' : '#333', border: ehMinha ? 'none' : '1px solid #E0D0E0', padding: '12px 16px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', color: ehMinha ? '#EADCEB' : '#777', marginBottom: '4px', fontWeight: 'bold' }}>
                      {msg.remetente_nome || (ehMinha ? 'Você' : 'Interlocutor')}
                    </div>
                    <div style={{ fontSize: '14px', whiteSpace: 'pre-line' }}>{msg.conteudo}</div>

                    {!isCostureira && ehProposta && (
                      <button
                        onClick={() => handleAceitarProposta(msg.dados_proposta || {}, msg.id_remetente)}
                        style={{ marginTop: '12px', width: '100%', padding: '9px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                      >
                        Aprovar Orçamento e Iniciar Serviço
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleEnviarMensagem} style={{ padding: '15px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              style={{ flex: 1, padding: '11px 14px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
            />
            <button type="submit" style={{ padding: '11px 20px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Enviar
            </button>
          </form>
        </div>

        {/* Painel Lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Financeiro & Agendamentos */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#3E2445', fontSize: '17px', fontWeight: 'bold' }}>Status do Pedido</h3>
            
            <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: '8px', padding: '12px', marginBottom: '15px' }}>
              <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Status Atual:</span>
              <strong style={{ color: '#E65100', fontSize: '14px' }}>{orcamentoAtual.status}</strong>
            </div>

            {isCostureira && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => {
                    setPropostaForm({
                      descricao: pedido?.descricao || '',
                      valorTotal: '',
                      valorEntrada: '',
                      previsaoEntrega: ''
                    });
                    setMostrarModalProposta(true);
                  }}
                  style={{ width: '100%', padding: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  + Enviar Orçamento
                </button>

                <button
                  onClick={() => setMostrarModalProva(true)}
                  style={{ width: '100%', padding: '10px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  Agendar Prova da Peça
                </button>
              </div>
            )}
          </div>

          {/* Ficha de Medidas */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#3E2445', fontSize: '17px', fontWeight: 'bold' }}>Ficha de Medidas</h3>
              <button onClick={() => setMostrarModalMedidas(true)} style={{ background: 'none', border: 'none', color: '#3E2445', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                Editar
              </button>
            </div>

            <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '0 0 10px 0', fontSize: '13px', color: '#555' }}>
              <li>Busto: {medidas.busto || '-'}</li>
              <li>Cintura: {medidas.cintura || '-'}</li>
              <li>Quadril: {medidas.quadril || '-'}</li>
            </ul>

            {medidas.observacoes_medidas && (
              <div style={{ fontSize: '12px', color: '#666', background: '#FAF7FA', padding: '8px', borderRadius: '6px' }}>
                <strong>Obs:</strong> {medidas.observacoes_medidas}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal Agendar Prova */}
      {mostrarModalProva && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#3E2445' }}>Agendar Prova da Peça</h3>
            <form onSubmit={handleAgendarProva}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Data da Prova *</label>
                <input
                  type="date"
                  value={formProva.dataProva}
                  onChange={(e) => setFormProva({ ...formProva, dataProva: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Observações / Instruções</label>
                <textarea
                  rows="3"
                  value={formProva.observacao}
                  onChange={(e) => setFormProva({ ...formProva, observacao: e.target.value })}
                  placeholder="Ex: Trazer o sapatão ou calçado que usará com o vestido"
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setMostrarModalProva(false)} style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '9px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Enviar Orçamento */}
      {mostrarModalProposta && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#3E2445' }}>Enviar Proposta de Orçamento</h3>
            <form onSubmit={handleEnviarProposta}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Descrição do Serviço</label>
                <textarea
                  rows="3"
                  value={propostaForm.descricao}
                  onChange={(e) => setPropostaForm({ ...propostaForm, descricao: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Valor Total (R$) *</label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={propostaForm.valorTotal}
                  onChange={(e) => setPropostaForm({ ...propostaForm, valorTotal: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setMostrarModalProposta(false)} style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '9px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
                  Enviar Proposta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha de Medidas */}
      {mostrarModalMedidas && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#3E2445' }}>Editar Ficha de Medidas</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="Busto (cm)" value={medidas.busto} onChange={(e) => setMedidas({ ...medidas, busto: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="text" placeholder="Cintura (cm)" value={medidas.cintura} onChange={(e) => setMedidas({ ...medidas, cintura: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="text" placeholder="Quadril (cm)" value={medidas.quadril} onChange={(e) => setMedidas({ ...medidas, quadril: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <textarea placeholder="Outras medidas e observações" value={medidas.observacoes_medidas} onChange={(e) => setMedidas({ ...medidas, observacoes_medidas: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setMostrarModalMedidas(false)} style={{ padding: '8px 14px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px' }}>
                Cancelar
              </button>
              <button type="button" onClick={salvarMedidasCliente} style={{ padding: '8px 14px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
                Salvar Medidas
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Chat;