import React, { useState, useEffect } from 'react';

function MeusPedidos({ usuario, onNavigate }) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pedidoParaEditar, setPedidoParaEditar] = useState(null);
  const [formEdicao, setFormEdicao] = useState({ descricao: '', prazo_desejado: '' });

  const idUsuario = usuario?.id_usuario || usuario?.id;

  useEffect(() => {
    if (idUsuario) {
      carregarMeusPedidos();
    }
  }, [idUsuario]);

  const carregarMeusPedidos = async () => {
    try {
      const response = await fetch('/api/pedidos');
      const data = await response.json();
      if (Array.isArray(data)) {
        // Filtra apenas os pedidos pertencentes ao cliente logado
        const meus = data.filter((p) => Number(p.clienteId || p.id_cliente) === Number(idUsuario));
        setPedidos(meus);
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setCarregando(false);
    }
  };

  // Separa Tipo de Serviço (sem colchetes), Localização e Descrição real
  const extrairInformacoes = (texto, localizacaoPadrao) => {
    if (!texto) {
      return {
        tipo: 'Pedido de Costura',
        localizacao: localizacaoPadrao || 'Não informada',
        descricao: ''
      };
    }

    let tipo = 'Pedido de Costura';
    let localizacao = localizacaoPadrao || 'Não informada';
    let descricao = texto;

    if (texto.includes('Localização:')) {
      const partes = texto.split('Localização:');

      const tipoExtraido = partes[0]
        .replace(/[\[\]]/g, '')
        .replace(/\s*-\s*$/, '')
        .trim();

      if (tipoExtraido) {
        tipo = tipoExtraido;
      }

      const resto = partes[1].trim();
      const quebraDupla = resto.indexOf('\n\n');

      if (quebraDupla !== -1) {
        localizacao = resto.substring(0, quebraDupla).trim();
        descricao = resto.substring(quebraDupla).trim();
      } else {
        const primeiraLinha = resto.split('\n')[0];
        localizacao = primeiraLinha.trim();
        descricao = resto.substring(primeiraLinha.length).trim();
      }
    } else {
      const matchColchetes = texto.match(/^\[([^\]]+)\]\s*(?:-?\s*)([\s\S]*)$/);
      if (matchColchetes) {
        tipo = matchColchetes[1].trim();
        descricao = matchColchetes[2].trim();
      }
    }

    return { tipo, localizacao, descricao };
  };

  // Formata data sem deslocamento de fuso horário
  const formatarData = (dataIso) => {
    if (!dataIso) return 'A combinar';
    if (typeof dataIso === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dataIso)) {
      const [ano, mes, dia] = dataIso.split('T')[0].split('-');
      return `${dia}/${mes}/${ano}`;
    }
    const data = new Date(dataIso);
    return isNaN(data.getTime()) ? 'A combinar' : data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  // Define cores distintas por status
  const obterEstiloStatus = (statusRaw) => {
    const s = (statusRaw || 'Aberto').toLowerCase().trim();

    if (s === 'aberto' || s === 'disponível' || s === 'disponivel') {
      return { background: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9' }; // Verde
    }
    if (s === 'aguardando prova') {
      return { background: '#FFF3E0', color: '#E65100', border: '1px solid #FFE082' }; // Laranja
    }
    if (s === 'em produção' || s === 'em producao' || s === 'a fazer') {
      return { background: '#E3F2FD', color: '#1565C0', border: '1px solid #BBDEFB' }; // Azul
    }
    if (s === 'concluído' || s === 'concluido') {
      return { background: '#E0F2F1', color: '#00695C', border: '1px solid #B2DFDB' }; // Verde-água
    }
    if (s === 'entregue') {
      return { background: '#F3E5F5', color: '#6A1B9A', border: '1px solid #E1BEE7' }; // Roxo
    }
    if (s === 'cancelado') {
      return { background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2' }; // Vermelho
    }

    return { background: '#F5F5F5', color: '#616161', border: '1px solid #E0E0E0' };
  };

  const handleCancelarPedido = async (idPedido) => {
    if (!window.confirm('Tem certeza de que deseja cancelar este pedido?')) return;

    try {
      const response = await fetch(`/api/pedidos/${idPedido}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Pedido cancelado com sucesso!');
        carregarMeusPedidos();
      } else {
        const data = await response.json();
        alert(data.erro || 'Erro ao cancelar o pedido.');
      }
    } catch (err) {
      alert(`Erro de conexão: ${err.message}`);
    }
  };

  const handleAbrirEdicao = (pedido) => {
    const info = extrairInformacoes(pedido.descricao, pedido.localizacao);
    const prazoRaw = pedido.prazoDesejado || pedido.prazo_desejado;
    const prazoFormatado = prazoRaw
      ? (typeof prazoRaw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(prazoRaw)
          ? prazoRaw.split('T')[0]
          : new Date(prazoRaw).toISOString().split('T')[0])
      : '';

    setPedidoParaEditar({ ...pedido, infoExtraida: info });
    setFormEdicao({
      descricao: info.descricao || pedido.descricao || '',
      prazo_desejado: prazoFormatado
    });
  };

  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    if (!pedidoParaEditar) return;

    const info = pedidoParaEditar.infoExtraida;
    const descricaoCompleta =
      info && info.localizacao && info.localizacao !== 'Não informada'
        ? `[${info.tipo}] - Localização: ${info.localizacao}\n\n${formEdicao.descricao.trim()}`
        : formEdicao.descricao.trim();

    try {
      const response = await fetch(`/api/pedidos/${pedidoParaEditar.id || pedidoParaEditar.id_pedido}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: idUsuario,
          descricao: descricaoCompleta,
          prazo_desejado: formEdicao.prazo_desejado
        })
      });

      if (response.ok) {
        alert('Pedido atualizado com sucesso!');
        setPedidoParaEditar(null);
        carregarMeusPedidos();
      } else {
        const data = await response.json();
        alert(data.erro || 'Erro ao atualizar pedido.');
      }
    } catch (err) {
      alert(`Erro ao atualizar pedido: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* Cabeçalho de Navegação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: '#fff', padding: '20px 25px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.08)' }}>
        <div>
          <h1 style={{ color: '#3E2445', margin: 0, fontSize: '24px' }}>Meus Pedidos</h1>
          <span style={{ fontSize: '14px', color: '#666' }}>Olá, <strong>{usuario?.nome || 'Cliente'}</strong></span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onNavigate && onNavigate('meusChats')}
            style={{ padding: '10px 18px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Minhas Conversas
          </button>
          
          <button
            onClick={() => onNavigate && onNavigate('publicarPedido')}
            style={{ padding: '10px 18px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            + Novo Pedido
          </button>

          <button
            onClick={() => onNavigate && onNavigate('perfil')}
            style={{ padding: '10px 18px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Ver Perfil
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('usuarioAtelie');
              if (onNavigate) onNavigate('inicio');
            }}
            style={{ padding: '10px 18px', background: 'transparent', color: '#C62828', border: '1px solid #C62828', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* Lista de Pedidos */}
      {carregando ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Carregando seus pedidos...</div>
      ) : pedidos.length === 0 ? (
        <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#777' }}>
          Você ainda não publicou nenhum pedido.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {pedidos.map((pedido) => {
            const statusAtual = pedido.status || pedido.status_pedido || 'Aberto';
            const isAberto = statusAtual.toLowerCase() === 'aberto';
            const info = extrairInformacoes(pedido.descricao, pedido.localizacao);
            const estiloStatus = obterEstiloStatus(statusAtual);

            return (
              <div
                key={pedido.id || pedido.id_pedido}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '20px 25px',
                  boxShadow: '0 4px 16px rgba(62, 36, 69, 0.08)',
                  border: '1px solid #EADCEB',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start'
                }}
              >
                {/* Imagem do Pedido */}
                {pedido.fotoReferencia && (
                  <img
                    src={pedido.fotoReferencia}
                    alt="Referência"
                    style={{ width: '130px', height: '130px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee', flexShrink: 0 }}
                  />
                )}

                {/* Detalhes do Pedido */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: '#3E2445', fontSize: '18px' }}>
                      {info.tipo}
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          ...estiloStatus
                        }}
                      >
                        Status: {statusAtual}
                      </span>
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        {formatarData(pedido.dataPublicacao || pedido.data_publicacao)}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', marginBottom: '15px' }}>
                    <div><strong>Localização:</strong> {info.localizacao}</div>
                    {info.descricao && (
                      <div style={{ marginTop: '4px', whiteSpace: 'pre-line' }}>
                        <strong>Descrição:</strong> {info.descricao}
                      </div>
                    )}
                    <div style={{ marginTop: '4px' }}>
                      <strong>Prazo desejado:</strong> {formatarData(pedido.prazoDesejado || pedido.prazo_desejado)}
                    </div>
                  </div>

                  {/* Ações Condicionais do Cliente */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    {!isAberto && (
                      <button
                        onClick={() => onNavigate && onNavigate('chat', pedido)}
                        style={{ padding: '9px 18px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Abrir Chat de Negociação
                      </button>
                    )}

                    {isAberto && (
                      <>
                        <button
                          onClick={() => handleAbrirEdicao(pedido)}
                          style={{ padding: '9px 18px', background: '#5E35B1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                        >
                          Editar Pedido
                        </button>

                        <button
                          onClick={() => handleCancelarPedido(pedido.id || pedido.id_pedido)}
                          style={{ padding: '9px 18px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                        >
                          Cancelar Pedido
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Edição de Pedido */}
      {pedidoParaEditar && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '450px', maxWidth: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#3E2445', fontSize: '18px' }}>Editar Pedido</h3>
            
            <form onSubmit={handleSalvarEdicao}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Descrição do Pedido</label>
                <textarea
                  rows="4"
                  value={formEdicao.descricao}
                  onChange={(e) => setFormEdicao({ ...formEdicao, descricao: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Prazo Desejado</label>
                <input
                  type="date"
                  value={formEdicao.prazo_desejado}
                  onChange={(e) => setFormEdicao({ ...formEdicao, prazo_desejado: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setPedidoParaEditar(null)}
                  style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default MeusPedidos;