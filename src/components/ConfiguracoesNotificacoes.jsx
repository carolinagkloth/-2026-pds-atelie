import React, { useState, useEffect } from 'react';

function ConfiguracoesNotificacoes({ usuario, onNavigate }) {
  const idUsuario = usuario?.id_usuario || usuario?.id;
  const isCostureira = (usuario?.tipo_usuario || usuario?.tipoUsuario || '').toString().toLowerCase() === 'costureira';

  const [config, setConfig] = useState({
    receber_whatsapp: true,
    notif_proposta: true,
    notif_chat: true,
    notif_prova: true,
    notif_status: true,
    notif_lembrete: true,
    notif_avaliacao: true,
    notif_cancelamento: true
  });

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (idUsuario) {
      fetch(`/api/usuarios/${idUsuario}/configuracoes-notificacoes`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.erro) {
            setConfig({
              receber_whatsapp: data.receber_whatsapp ?? true,
              notif_proposta: data.notif_proposta ?? true,
              notif_chat: data.notif_chat ?? true,
              notif_prova: data.notif_prova ?? true,
              notif_status: data.notif_status ?? true,
              notif_lembrete: data.notif_lembrete ?? true,
              notif_avaliacao: data.notif_avaliacao ?? true,
              notif_cancelamento: data.notif_cancelamento ?? true
            });
          }
        })
        .finally(() => setCarregando(false));
    }
  }, [idUsuario]);

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const response = await fetch(`/api/usuarios/${idUsuario}/configuracoes-notificacoes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        alert('Preferências salvas com sucesso!');
        if (onNavigate) onNavigate(isCostureira ? 'feedPedidos' : 'meusPedidos');
      } else {
        alert('Erro ao salvar.');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const toggle = (chave) => {
    setConfig((prev) => ({ ...prev, [chave]: !prev[chave] }));
  };

  return (
    <div style={{ maxWidth: '650px', margin: '30px auto', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <button
        onClick={() => onNavigate && onNavigate(isCostureira ? 'feedPedidos' : 'meusPedidos')}
        style={{ background: 'none', border: 'none', color: '#3E2445', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px', fontSize: '14px' }}
      >
        ← Voltar aos Pedidos
      </button>

      <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.1)' }}>
        <h2 style={{ color: '#3E2445', marginTop: 0, fontSize: '22px' }}>⚙️ Configurações de Notificações</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '25px' }}>
          Gira o recebimento de mensagens no seu WhatsApp e alertas por e-mail.
        </p>

        {carregando ? (
          <div>Carregando preferências...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Chave Principal do WhatsApp */}
            <div style={{ padding: '16px', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1B5E20' }}>💬 Receber Mensagens no WhatsApp</div>
                <div style={{ fontSize: '12px', color: '#333', marginTop: '2px' }}>
                  Avisos urgentes (provas agendadas, proposta aceita e lembretes de véspera).
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.receber_whatsapp}
                onChange={() => toggle('receber_whatsapp')}
                style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#2E7D32' }}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />
            <h4 style={{ margin: 0, color: '#3E2445' }}>Notificações por E-mail</h4>

            <ItemToggle label="Propostas de Orçamento" descricao="Novos orçamentos recebidos ou enviados" ativo={config.notif_proposta} onToggle={() => toggle('notif_proposta')} />
            <ItemToggle label="Novas Mensagens no Chat" descricao="Respostas de mensagens trocadas" ativo={config.notif_chat} onToggle={() => toggle('notif_chat')} />
            <ItemToggle label="Agendamento de Prova" descricao="Avisos sobre datas de prova marcadas" ativo={config.notif_prova} onToggle={() => toggle('notif_prova')} />
            <ItemToggle label="Mudança de Status" descricao="Alertas de 'Em Produção' ou 'Concluído'" ativo={config.notif_status} onToggle={() => toggle('notif_status')} />
            <ItemToggle label="Lembretes de Compromisso" descricao="Aviso de véspera de provas e entregas" ativo={config.notif_lembrete} onToggle={() => toggle('notif_lembrete')} />
            <ItemToggle label="Solicitação de Avaliação" descricao="Alertas ao concluir um serviço" ativo={config.notif_avaliacao} onToggle={() => toggle('notif_avaliacao')} />
            <ItemToggle label="Cancelamento de Pedidos" descricao="Avisos caso um pedido seja cancelado" ativo={config.notif_cancelamento} onToggle={() => toggle('notif_cancelamento')} />

            <button
              onClick={handleSalvar}
              disabled={salvando}
              style={{ marginTop: '20px', width: '100%', padding: '12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              {salvando ? 'Salvando...' : 'Salvar Preferências'}
            </button>

          </div>
        )}
      </div>
    </div>
  );
}

function ItemToggle({ label, descricao, ativo, onToggle }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #eee', borderRadius: '8px', background: '#FAF7FA' }}>
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#3E2445' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{descricao}</div>
      </div>
      <input type="checkbox" checked={ativo} onChange={onToggle} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3E2445' }} />
    </div>
  );
}

export default ConfiguracoesNotificacoes;