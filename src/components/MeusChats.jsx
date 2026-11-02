import React, { useState, useEffect } from 'react';

function MeusChats({ usuario, onNavigate }) {
  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const usuarioAtual = usuario && Object.keys(usuario).length > 0 ? usuario : usuarioSalvo;
  const idUsuario = usuarioAtual?.id_usuario || usuarioAtual?.id;
  const isCostureira = (usuarioAtual?.tipo_usuario || usuarioAtual?.tipoUsuario || '').toString().toLowerCase() === 'costureira';

  const [conversas, setConversas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  useEffect(() => {
    if (idUsuario) {
      carregarConversas();
    }
  }, [idUsuario]);

  const carregarConversas = () => {
    setCarregando(true);
    fetch(`/api/conversas/usuario/${idUsuario}`)
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao carregar a lista de conversas.');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setConversas(data);
        } else {
          setConversas([]);
        }
      })
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioAtelie');
    if (onNavigate) onNavigate('inicio');
  };

  const extrairDescricaoLimpa = (texto) => {
    if (!texto) return '';
    if (texto.includes('Localização:')) {
      const partes = texto.split('Localização:');
      const resto = partes[1].trim();
      const quebra = resto.indexOf('\n\n');
      if (quebra !== -1) {
        return resto.substring(quebra).trim();
      }
      const primeiraLinha = resto.split('\n')[0];
      return resto.substring(primeiraLinha.length).trim();
    }
    return texto;
  };

  const conversasFiltradas = conversas.filter((item) => {
    const statusItem = item.status || 'Aberto';
    if (filtroStatus === 'Todos') return true;
    return statusItem.toLowerCase() === filtroStatus.toLowerCase();
  });

  return (
    <div style={{ maxWidth: '850px', margin: '30px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: '#3E2445', margin: 0, fontSize: '22px' }}>Conversas em Andamento</h2>
          <span style={{ fontSize: '13px', color: '#666', marginTop: '4px', display: 'block' }}>
            Olá, <strong>{usuarioAtual?.nome || 'Usuário'}</strong> ({isCostureira ? 'Costureira' : 'Cliente'})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate && onNavigate(isCostureira ? 'feedPedidos' : 'meusPedidos')}
            style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Ver Pedidos
          </button>
          <button
            onClick={() => onNavigate && onNavigate('perfil')}
            style={{ padding: '9px 16px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Ver Perfil
          </button>
          <button
            onClick={handleLogout}
            style={{ padding: '9px 16px', background: 'transparent', color: '#C62828', border: '1px solid #C62828', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* Filtro por Status */}
      <div style={{ background: '#F9F6F9', padding: '15px', borderRadius: '8px', border: '1px solid #EADFEA', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#3E2445' }}>Filtrar por Status:</label>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          style={{ flex: 1, padding: '9px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', fontSize: '14px', background: '#fff' }}
        >
          <option value="Todos">Todos os Status</option>
          <option value="Aberto">Aberto / Em Negociação</option>
          <option value="Em Produção">Em Produção</option>
          <option value="Aguardando Prova">Aguardando Prova</option>
          <option value="Concluído">Concluído</option>
        </select>
      </div>

      {carregando && <p style={{ textAlign: 'center', color: '#666' }}>Carregando conversas...</p>}
      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{erro}</div>}

      {!carregando && conversasFiltradas.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fdfdfd', border: '2px dashed #e0d0e0', borderRadius: '8px' }}>
          <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>Nenhuma conversa encontrada para o filtro selecionado.</p>
        </div>
      )}

      {/* Lista de Conversas no estilo Inbox / WhatsApp */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {conversasFiltradas.map((item) => {
          const nomeOutraPessoa = isCostureira ? item.clienteNome : (item.costureiraNome || 'Ateliê');
          const dataFormatada = item.dataUltimaAtividade ? new Date(item.dataUltimaAtividade).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';

          return (
            <div
              key={item.idPedido}
              onClick={() => onNavigate && onNavigate('chat', item)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #E0E0E0', borderRadius: '10px', padding: '18px', cursor: 'pointer', transition: 'border-color 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3E2445')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
            >
              <div style={{ flex: 1, paddingRight: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{ margin: 0, color: '#3E2445', fontSize: '16px', fontWeight: 'bold' }}>{nomeOutraPessoa || 'Contato'}</h3>
                  <span style={{ background: '#E8D8E8', color: '#3E2445', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                    {item.status || 'Aberto'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>
                  <strong>Pedido:</strong> {extrairDescricaoLimpa(item.descricao) || 'Serviço'}
                </div>

                <div style={{ fontSize: '13px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '500px' }}>
                  {item.ultimaMensagem || 'Nenhuma mensagem trocada ainda.'}
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#888' }}>{dataFormatada}</span>
                <button
                  style={{ padding: '8px 14px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  Abrir Chat
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default MeusChats;