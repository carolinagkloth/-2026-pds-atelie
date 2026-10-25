import React, { useState, useEffect } from 'react';
import "../styles/MeusPedidos.css";

function MeusPedidos({ usuario, onNavigate }) {
  const usuarioSalvo = JSON.parse(
    localStorage.getItem('usuarioAtelie') || '{}'
  );

  const usuarioAtual = usuario || usuarioSalvo;
  const isCliente = usuarioAtual?.tipo_usuario === 'Cliente';
  const idCliente = usuarioAtual?.id_usuario || usuarioAtual?.id;

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/pedidos')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Erro ao carregar a lista de pedidos.');
        }

        return res.json();
      })
      .then((data) => {
        const listaFiltrada = isCliente
          ? data.filter(
              (p) =>
                Number(p.clienteId) === Number(idCliente)
            )
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
    const confirmacao = window.confirm(
      'Tem certeza de que deseja cancelar este pedido?'
    );

    if (!confirmacao) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/pedidos/${idPedido}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro || 'Erro ao cancelar o pedido.'
        );
      }

      // Remove o pedido cancelado da lista em tempo real
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
        localizacao:
          localizacaoPadrao || 'Não informada',
        descricao: ''
      };
    }

    let tipo = 'Ajuste / Conserto';
    let localizacao =
      localizacaoPadrao || 'Não informada';
    let descricao = texto;

    if (texto.includes('Localização:')) {
      const partes = texto.split('Localização:');

      let tipoExtraido = partes[0]
        .replace('[', '')
        .replace(']', '')
        .replace('-', '')
        .trim();

      if (tipoExtraido) {
        if (
          tipoExtraido.toUpperCase() === 'AJUSTE'
        ) {
          tipo = 'Ajuste / Conserto';
        } else {
          tipo = tipoExtraido;
        }
      }

      const resto = partes[1].trim();
      const quebra = resto.indexOf('\n');

      if (quebra !== -1) {
        localizacao = resto
          .substring(0, quebra)
          .trim();

        descricao = resto
          .substring(quebra)
          .trim();
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
    <div className="pedidos-card">

      <div className="pedidos-header">

        <h2>
          {isCliente
            ? 'Meus Pedidos'
            : 'Solicitações Recebidas'}
        </h2>

        {isCliente && (
          <button
            onClick={() =>
              onNavigate &&
              onNavigate('publicarPedido')
            }
            className="pedidos-novo-button"
          >
            + Novo Pedido
          </button>
        )}

      </div>

      {carregando && (
        <p className="pedidos-carregando">
          Carregando pedidos...
        </p>
      )}

      {erro && (
        <div className="pedidos-erro">
          {erro}
        </div>
      )}

      {!carregando && pedidos.length === 0 && (
        <div className="pedidos-vazio">
          <p>
            {isCliente
              ? 'Você ainda não publicou nenhum pedido.'
              : 'Nenhum pedido disponível no momento.'}
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

                  <h3>
                    {info.tipo}
                  </h3>

                  <div className="pedido-meta">

                    <span className="pedido-status">
                      Status: {pedido.status || 'Aberto'}
                    </span>

                    <span className="pedido-data">
                      {formatarData(
                        pedido.dataPublicacao
                      )}
                    </span>

                  </div>

                </div>

                <div className="pedido-detalhes">

                  <div>
                    <strong>
                      Localização:
                    </strong>{' '}
                    {info.localizacao}
                  </div>

                  <div>
                    <strong>
                      Descrição:
                    </strong>{' '}
                    {info.descricao}
                  </div>

                  <div>
                    <strong>
                      Prazo desejado:
                    </strong>{' '}
                    {formatarData(
                      pedido.prazoDesejado
                    )}
                  </div>

                </div>

                {podeCancelar && (
                  <div className="pedido-acoes">

                    <button
                      onClick={() =>
                        handleCancelarPedido(
                          pedido.id
                        )
                      }
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