import React, { useState, useEffect } from 'react';
import AvaliacaoPedido from './AvaliacaoPedido';
import "../styles/MeusPedidos.css";

function MeusPedidos({ usuario, onNavigate }) {
  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const usuarioAtual = usuario && Object.keys(usuario).length > 0 ? usuario : usuarioSalvo;
  const tipoFormatado = (usuarioAtual?.tipo_usuario || usuarioAtual?.tipoUsuario || 'Cliente').toString().toLowerCase();
  const isCliente = tipoFormatado === 'cliente';
  const idCliente = usuarioAtual?.id_usuario || usuarioAtual?.id;

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  
  const [pedidoParaAvaliar, setPedidoParaAvaliar] = useState(null);

  const [pedidoEmEdicao, setPedidoEmEdicao] = useState(null);
  const [formEdicao, setFormEdicao] = useState({
    tipo: 'Ajuste / Conserto',
    localizacao: '',
    descricao: '',
    prazoDesejado: '',
    fotoReferencia: ''
  });

  const extrairInformacoes = (texto, localizacaoPadrao) => {
    if (!texto) {
      return {
        tipo: 'Ajuste / Conserto',
        localizacao: localizacaoPadrao || 'Não informada',
        descricao: ''
      };
    }

    let tipo = 'Ajuste / Conserto';
    let localizacao = localizacaoPadrao || 'Não informada';
    let descricao = texto;

    if (texto.includes('Localização:')) {
      const partes = texto.split('Localização:');

      let tipoExtraido = partes[0]
        .replace('[', '')
        .replace(']', '')
        .replace('-', '')
        .trim();

      if (tipoExtraido) {
        tipo = tipoExtraido;
      }

      const resto = partes[1].trim();
      const quebra = resto.indexOf('\n\n');

      if (quebra !== -1) {
        localizacao = resto.substring(0, quebra).trim();
        descricao = resto.substring(quebra).trim();
      } else {
        const primeiraLinha = resto.split('\n')[0];
        localizacao = primeiraLinha.trim();
        descricao = resto.substring(primeiraLinha.length).trim();
      }
    }

    return { tipo, localizacao, descricao };
  };

  const carregarPedidos = () => {
    setCarregando(true);
    fetch('/api/pedidos')
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao carregar a lista de pedidos.');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const listaFiltrada = isCliente
            ? data.filter((p) => Number(p.clienteId) === Number(idCliente))
            : data;
          setPedidos(listaFiltrada);
        } else {
          setPedidos([]);
        }
      })
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregarPedidos();
  }, [idCliente, isCliente]);

  const handleLogout = () => {
    localStorage.removeItem('usuarioAtelie');
    if (onNavigate) onNavigate('inicio');
  };

  const handleAbrirEdicao = (pedido) => {
    const info = extrairInformacoes(pedido.descricao, pedido.localizacao);
    setPedidoEmEdicao(pedido);
    setFormEdicao({
      tipo: info.tipo || 'Ajuste / Conserto',
      localizacao: info.localizacao !== 'Não informada' ? info.localizacao : '',
      descricao: info.descricao || '',
      prazoDesejado: pedido.prazoDesejado ? new Date(pedido.prazoDesejado).toISOString().split('T')[0] : '',
      fotoReferencia: pedido.fotoReferencia || ''
    });
  };

  const handleFotoEdicaoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormEdicao((prev) => ({ ...prev, fotoReferencia: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvarEdicao = async (e) => {
    e.preventDefault();

    if (!formEdicao.descricao.trim()) {
      alert('A descrição do pedido é obrigatória!');
      return;
    }

    const descricaoFormatada = `[${formEdicao.tipo}] - Localização: ${formEdicao.localizacao || 'Não informada'}\n\n${formEdicao.descricao.trim()}`;

    try {
      const response = await fetch(`/api/pedidos/${pedidoEmEdicao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: idCliente,
          descricao: descricaoFormatada,
          prazo_desejado: formEdicao.prazoDesejado,
          fotos_referencia: formEdicao.fotoReferencia
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao atualizar o pedido.');

      alert('Pedido atualizado com sucesso!');
      setPedidoEmEdicao(null);
      carregarPedidos();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleCancelarPedido = async (idPedido) => {
    if (!window.confirm('Tem certeza de que deseja cancelar este pedido?')) return;

    try {
      const response = await fetch(`/api/pedidos/${idPedido}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao cancelar o pedido.');

      setPedidos((prev) => prev.filter((p) => p.id !== idPedido));
      alert('Pedido cancelado com sucesso!');
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return '-';
    return new Date(dataIso).toLocaleDateString('pt-BR');
  };

  return (
    <div style={{ maxWidth: '850px', margin: '30px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* Cabeçalho com Botão de Conversas para o Cliente */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: '#3E2445', margin: 0, fontSize: '22px' }}>
            {isCliente ? 'Meus Pedidos' : 'Solicitações Recebidas'}
          </h2>
          {usuarioAtual?.nome && (
            <span style={{ fontSize: '13px', color: '#666', marginTop: '4px', display: 'block' }}>
              Olá, <strong>{usuarioAtual.nome}</strong>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate && onNavigate('meusChats')}
            style={{ padding: '9px 16px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Minhas Conversas
          </button>

          {isCliente && (
            <button
              onClick={() => onNavigate && onNavigate('publicarPedido')}
              style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              + Novo Pedido
            </button>
          )}

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

      {carregando && <p style={{ textAlign: 'center', color: '#666' }}>Carregando pedidos...</p>}
      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{erro}</div>}

      {!carregando && pedidos.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fdfdfd', border: '2px dashed #e0d0e0', borderRadius: '8px' }}>
          <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>
            {isCliente ? 'Você ainda não publicou nenhum pedido.' : 'Nenhum pedido disponível no momento.'}
          </p>
        </div>
      )}

      {/* Modal de Avaliação */}
      {pedidoParaAvaliar && (
        <div style={{ marginBottom: '25px' }}>
          <AvaliacaoPedido
            idOrdemServico={pedidoParaAvaliar.idOrdemServico || pedidoParaAvaliar.id}
            idCliente={idCliente}
            onSucesso={() => {
              setPedidoParaAvaliar(null);
              carregarPedidos();
            }}
            onCancelar={() => setPedidoParaAvaliar(null)}
          />
        </div>
      )}

      {/* Modal de Edição */}
      {pedidoEmEdicao && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '480px', maxWidth: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <h3 style={{ marginTop: 0, color: '#3E2445', fontSize: '18px' }}>Editar Pedido</h3>
            
            <form onSubmit={handleSalvarEdicao}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>
                  Tipo de Serviço
                </label>
                <select
                  value={formEdicao.tipo}
                  onChange={(e) => setFormEdicao({ ...formEdicao, tipo: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
                >
                  <option value="Ajuste / Conserto">Ajuste / Conserto</option>
                  <option value="Confecção sob Medida">Confecção sob Medida</option>
                  <option value="Customização / Bordado">Customização / Bordado</option>
                  <option value="Vestido de Festa">Vestido de Festa</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Bairro / Localização</label>
                <input
                  type="text"
                  value={formEdicao.localizacao}
                  onChange={(e) => setFormEdicao({ ...formEdicao, localizacao: e.target.value })}
                  placeholder="Ex: Órfãs"
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Descrição do Pedido *</label>
                <textarea
                  rows="3"
                  value={formEdicao.descricao}
                  onChange={(e) => setFormEdicao({ ...formEdicao, descricao: e.target.value })}
                  placeholder="Descreva a peça e os ajustes necessários..."
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Prazo Desejado</label>
                <input
                  type="date"
                  value={formEdicao.prazoDesejado}
                  onChange={(e) => setFormEdicao({ ...formEdicao, prazoDesejado: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Foto de Referência</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoEdicaoChange}
                  style={{ width: '100%', fontSize: '12px' }}
                />
                {formEdicao.fotoReferencia && (
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <img src={formEdicao.fotoReferencia} alt="Prévia" style={{ maxHeight: '80px', borderRadius: '4px' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setPedidoEmEdicao(null)}
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

      {/* Lista de Pedidos */}
      <div className="pedidos-lista">
        {pedidos.map((pedido) => {
          const info = extrairInformacoes(pedido.descricao, pedido.localizacao);

          const podeEditar = isCliente && (pedido.status === 'Aberto' || pedido.status === 'Disponível' || !pedido.status);
          const podeCancelar = isCliente && (pedido.status === 'Aberto' || pedido.status === 'Disponível' || !pedido.status);
          const podeAvaliar = isCliente && (pedido.status === 'Concluído' || pedido.status === 'Concluido') && !pedido.jaAvaliado;

          return (
            <div key={pedido.id} className="pedido-item">
              {pedido.fotoReferencia && (
                <div className="pedido-imagem-area">
                  <img src={pedido.fotoReferencia} alt="Referência" className="pedido-imagem" />
                </div>
              )}

              <div className="pedido-conteudo">
                <div className="pedido-topo">
                  <h3>{info.tipo}</h3>
                  <div className="pedido-meta">
                    <span className="pedido-status">Status: {pedido.status || 'Aberto'}</span>
                    <span className="pedido-data">{formatarData(pedido.dataPublicacao)}</span>
                  </div>
                </div>

                <div className="pedido-detalhes">
                  <div><strong>Localização:</strong> {info.localizacao}</div>
                  <div><strong>Descrição:</strong> {info.descricao}</div>
                  <div><strong>Prazo desejado:</strong> {formatarData(pedido.prazoDesejado)}</div>
                </div>

                {/* Área de Ações */}
                <div className="pedido-acoes" style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onNavigate && onNavigate('chat', pedido)}
                    style={{ padding: '8px 14px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    Abrir Chat de Negociação
                  </button>

                  {podeEditar && (
                    <button
                      onClick={() => handleAbrirEdicao(pedido)}
                      style={{ padding: '8px 14px', background: '#5E35B1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      Editar Pedido
                    </button>
                  )}

                  {podeCancelar && (
                    <button
                      onClick={() => handleCancelarPedido(pedido.id)}
                      style={{ padding: '8px 14px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      Cancelar Pedido
                    </button>
                  )}

                  {podeAvaliar && (
                    <button
                      onClick={() => setPedidoParaAvaliar(pedido)}
                      style={{ padding: '8px 14px', background: '#FFB400', color: '#3E2445', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      Avaliar Serviço
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MeusPedidos;