import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetch('/api/pedidos')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Erro ao carregar a lista de pedidos.');
        }
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
      .catch((err) => {
        setErro(err.message);
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [idCliente, isCliente]);

  const handleLogout = () => {
    localStorage.removeItem('usuarioAtelie');
    if (onNavigate) {
      onNavigate('inicio');
    }
  };

  const handleCancelarPedido = async (idPedido) => {
    const confirmacao = window.confirm(
      'Tem certeza de que deseja cancelar este pedido?'
    );

    if (!confirmacao) return;

    try {
      const response = await fetch(`/api/pedidos/${idPedido}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro || 'Erro ao cancelar o pedido.'
        );
      }

      setPedidos((pedidosAnteriores) =>
        pedidosAnteriores.filter(
          (p) => p.id !== idPedido
        )
      );

      alert('Pedido cancelado com sucesso!');
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const extrairInformacoes = (
    texto,
    localizacaoPadrao
  ) => {
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
        if (tipoExtraido.toUpperCase() === 'AJUSTE') {
          tipo = 'Ajuste / Conserto';
        } else {
          tipo = tipoExtraido;
        }
      }

      const resto = partes[1].trim();
      const quebra = resto.indexOf('\n');

      if (quebra !== -1) {
        localizacao = resto.substring(0, quebra).trim();
        descricao = resto.substring(quebra).trim();
      } else {
        localizacao = resto;
        descricao = resto;
      }
    }

    return {
      tipo,
      localizacao,
      descricao
    };
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return '-';
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <div style={{ maxWidth: '850px', margin: '30px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
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

      <div className="pedidos-lista">
        {pedidos.map((pedido) => {
          const info = extrairInformacoes(
            pedido.descricao,
            pedido.localizacao
          );

          const podeCancelar =
            isCliente &&
            (
              pedido.status === 'Aberto' ||
              pedido.status === 'Disponível' ||
              !pedido.status
            );

          return (
            <div
              key={pedido.id}
              className="pedido-item"
            >
              {pedido.fotoReferencia && (
                <div className="pedido-imagem-area">
                  <img
                    src={pedido.fotoReferencia}
                    alt="Referência da peça"
                    className="pedido-imagem"
                  />
                </div>
              )}

              <div className="pedido-conteudo">
                <div className="pedido-topo">
                  <h3>{info.tipo}</h3>
                  <div className="pedido-meta">
                    <span className="pedido-status">
                      Status: {pedido.status || 'Aberto'}
                    </span>
                    <span className="pedido-data">
                      {formatarData(pedido.dataPublicacao)}
                    </span>
                  </div>
                </div>

                <div className="pedido-detalhes">
                  <div>
                    <strong>Localização:</strong> {info.localizacao}
                  </div>
                  <div>
                    <strong>Descrição:</strong> {info.descricao}
                  </div>
                  <div>
                    <strong>Prazo desejado:</strong> {formatarData(pedido.prazoDesejado)}
                  </div>
                </div>

                {podeCancelar && (
                  <div className="pedido-acoes">
                    <button
                      onClick={() => handleCancelarPedido(pedido.id)}
                      className="pedido-cancelar-button"
                    >
                      Cancelar Pedido
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MeusPedidos;