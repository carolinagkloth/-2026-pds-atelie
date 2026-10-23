import React, { useState, useEffect } from 'react';

function MeusPedidos({ usuario, onNavigate }) {
  const usuarioSalvo = JSON.parse(localStorage.getItem('usuarioAtelie') || '{}');
  const usuarioAtual = usuario || usuarioSalvo;
  const isCliente = usuarioAtual?.tipo_usuario === 'Cliente';
  const idCliente = usuarioAtual?.id_usuario || usuarioAtual?.id;

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/pedidos')
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao carregar a lista de pedidos.');
        return res.json();
      })
      .then((data) => {
        const listaFiltrada = isCliente
          ? data.filter((p) => Number(p.clienteId) === Number(idCliente))
          : data;

        setPedidos(listaFiltrada);
      })
      .catch((err) => {
        setErro(err.message);
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [idCliente, isCliente]);

  const handleCancelarPedido = async (idPedido) => {
    const confirmacao = window.confirm('Tem certeza de que deseja cancelar este pedido?');
    if (!confirmacao) return;

    try {
      const response = await fetch(`http://localhost:3000/api/pedidos/${idPedido}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao cancelar o pedido.');
      }

      // Remove o pedido cancelado da lista em tempo real
      setPedidos((pedidosAnteriores) =>
        pedidosAnteriores.filter((p) => p.id !== idPedido)
      );

      alert('Pedido cancelado com sucesso!');
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const extrairInformacoes = (texto, localizacaoPadrao) => {
    if (!texto) return { tipo: 'Ajuste / Conserto', localizacao: localizacaoPadrao || 'Não informada', descricao: '' };

    let tipo = 'Ajuste / Conserto';
    let localizacao = localizacaoPadrao || 'Não informada';
    let descricao = texto;

    if (texto.includes('Localização:')) {
      const partes = texto.split('Localização:');
      let tipoExtraido = partes[0].replace('[', '').replace(']', '').replace('-', '').trim();

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

    return { tipo, localizacao, descricao };
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return '-';
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <div style={{ maxWidth: '850px', margin: '30px auto', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ color: '#3E2445', margin: 0 }}>
          {isCliente ? 'Meus Pedidos' : 'Solicitações Recebidas'}
        </h2>
        {isCliente && (
          <button
            onClick={() => onNavigate && onNavigate('publicarPedido')}
            style={{ padding: '10px 18px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            + Novo Pedido
          </button>
        )}
      </div>

      {carregando && <p style={{ textAlign: 'center', color: '#666' }}>Carregando pedidos...</p>}
      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{erro}</div>}

      {!carregando && pedidos.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fdfdfd', border: '2px dashed #e0d0e0', borderRadius: '8px' }}>
          <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
            {isCliente ? 'Você ainda não publicou nenhum pedido.' : 'Nenhum pedido disponível no momento.'}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {pedidos.map((pedido) => {
          const info = extrairInformacoes(pedido.descricao, pedido.localizacao);
          const podeCancelar = isCliente && (pedido.status === 'Aberto' || pedido.status === 'Disponível' || !pedido.status);

          return (
            <div
              key={pedido.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                background: '#fff',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start'
              }}
            >
              {pedido.fotoReferencia && (
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={pedido.fotoReferencia}
                    alt="Referência da peça"
                    style={{
                      width: '160px',
                      height: '160px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      background: '#fafafa'
                    }}
                  />
                </div>
              )}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                  <h3 style={{ margin: 0, color: '#3E2445', fontSize: '18px', fontWeight: 'bold' }}>
                    {info.tipo}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      background: '#E8D8E8',
                      color: '#3E2445',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      Status: {pedido.status || 'Aberto'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      {formatarData(pedido.dataPublicacao)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#333' }}>
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
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right' }}>
                    <button
                      onClick={() => handleCancelarPedido(pedido.id)}
                      style={{
                        padding: '6px 14px',
                        background: '#c62828',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
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