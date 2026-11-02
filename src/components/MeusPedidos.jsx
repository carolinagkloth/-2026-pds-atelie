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
        const meus = data.filter((p) => Number(p.clienteId) === Number(idUsuario));
        setPedidos(meus);
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setCarregando(false);
    }
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
    setPedidoParaEditar(pedido);
    setFormEdicao({
      descricao: pedido.descricao || '',
      prazo_desejado: pedido.prazoDesejado ? new Date(pedido.prazoDesejado).toISOString().split('T')[0] : ''
    });
  };

  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    if (!pedidoParaEditar) return;

    try {
      const response = await fetch(`/api/pedidos/${pedidoParaEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: idUsuario,
          descricao: formEdicao.descricao,
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
            const isAberto = (pedido.status || '').toLowerCase() === 'aberto';

            return (
              <div
                key={pedido.id}
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
                    style={{ width: '130px', height: '130px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }}
                  />
                )}

                {/* Detalhes do Pedido */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, color: '#3E2445', fontSize: '18px' }}>
                      {pedido.descricao ? pedido.descricao.split('\n')[0] : 'Pedido de Costura'}
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: isAberto ? '#EADCEB' : '#FFF3E0',
                          color: isAberto ? '#3E2445' : '#E65100'
                        }}
                      >
                        Status: {pedido.status || 'Aberto'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        {pedido.dataPublicacao ? new Date(pedido.dataPublicacao).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', marginBottom: '15px' }}>
                    <div><strong>Localização:</strong> {pedido.localizacao || 'Não informada'}</div>
                    <div style={{ marginTop: '4px', whiteSpace: 'pre-line' }}><strong>Descrição:</strong> {pedido.descricao}</div>
                    <div style={{ marginTop: '4px' }}>
                      <strong>Prazo desejado:</strong> {pedido.prazoDesejado ? new Date(pedido.prazoDesejado).toLocaleDateString('pt-BR') : 'A combinar'}
                    </div>
                  </div>

                  {/* Ações Condicionais do Cliente */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    
                    {/* Botão de Chat: visível APENAS para pedidos que NÃO estão mais "Aberto" */}
                    {!isAberto && (
                      <button
                        onClick={() => onNavigate && onNavigate('chat', pedido)}
                        style={{ padding: '9px 18px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Abrir Chat de Negociação
                      </button>
                    )}

                    {/* Botões de Edição/Cancelamento: Apenas para pedidos "Aberto" */}
                    {isAberto && (
                      <>
                        <button
                          onClick={() => handleAbrirEdicao(pedido)}
                          style={{ padding: '9px 18px', background: '#5E35B1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                        >
                          Editar Pedido
                        </button>

                        <button
                          onClick={() => handleCancelarPedido(pedido.id)}
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