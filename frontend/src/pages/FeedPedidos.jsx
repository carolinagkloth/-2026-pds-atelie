import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderCostureira from "../components/HeaderCostureira";

function FeedPedidos() {
  const navigate = useNavigate();

  const usuarioSalvo =
    localStorage.getItem("usuario");

  const usuario = usuarioSalvo
    ? JSON.parse(usuarioSalvo)
    : null;

  const idCostureira =
    usuario?.id_usuario ||
    usuario?.id ||
    "costureira-local";

  const nomeCostureira =
    usuario?.nome ||
    "Costureira";

  const [categoria, setCategoria] =
    useState("");

  const [localizacao, setLocalizacao] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [busca, setBusca] =
    useState("");

  const [pedidos, setPedidos] =
    useState(() => {

      const pedidosSalvos =
        localStorage.getItem(
          "pedidosCliente"
        );

      return pedidosSalvos
        ? JSON.parse(pedidosSalvos)
        : [];

    });

  const [
    pedidoSelecionado,
    setPedidoSelecionado
  ] = useState(null);


  const pedidosFiltrados =
    pedidos.filter((pedido) => {

      const categoriaCorresponde =
        categoria === "" ||
        pedido.categoria === categoria ||
        pedido.tipoServico === categoria;

      const localizacaoCorresponde =
        localizacao === "" ||
        pedido.localizacao
          ?.toLowerCase()
          .includes(
            localizacao.toLowerCase()
          );

      const statusCorresponde =
        status === "" ||
        pedido.status === status;

      const buscaCorresponde =
        busca === "" ||
        pedido.titulo
          ?.toLowerCase()
          .includes(
            busca.toLowerCase()
          ) ||
        pedido.descricao
          ?.toLowerCase()
          .includes(
            busca.toLowerCase()
          );

      return (
        categoriaCorresponde &&
        localizacaoCorresponde &&
        statusCorresponde &&
        buscaCorresponde
      );
    });


  function demonstrarInteresse(idPedido) {

    const pedidosAtualizados =
      pedidos.map((pedido) => {

        if (pedido.id === idPedido) {

          return {
            ...pedido,

            status: "Em negociação",

            id_costureira:
              idCostureira,

            costureiraNome:
              nomeCostureira,
          };
        }

        return pedido;
      });


    setPedidos(
      pedidosAtualizados
    );

    navigate(
      `/mensagens-costureira?pedido=${idPedido}`
    );

    localStorage.setItem(
      "pedidosCliente",
      JSON.stringify(
        pedidosAtualizados
      )
    );
  }


  return (
    <>
      <HeaderCostureira />

      <main className="inicio-costureira">

        <section className="inicio-pedidos">

          <div className="inicio-pedidos-cabecalho">

            <div>

              <span className="secao-legenda">
                Novas oportunidades
              </span>

              <h2>
                Pedidos disponíveis
              </h2>

              <p>
                Encontre serviços que combinam
                com suas especialidades.
              </p>

            </div>

            <span className="quantidade-pedidos">

              {
                pedidosFiltrados.length
              } encontrados

            </span>

          </div>


          {/* BUSCA */}

          <div className="barra-busca-pedidos">

            <input
              type="text"
              placeholder="Buscar pedido..."
              value={busca}
              onChange={(event) =>
                setBusca(
                  event.target.value
                )
              }
            />

          </div>


          {/* FILTROS */}

          <div className="filtros-inicio">

            <select
              value={categoria}
              onChange={(event) =>
                setCategoria(
                  event.target.value
                )
              }
            >

              <option value="">
                Todas as categorias
              </option>

              <option value="Ajustes">
                Ajustes
              </option>

              <option value="Sob medida">
                Sob medida
              </option>

              <option value="Customização">
                Customização
              </option>

              <option value="Consertos">
                Consertos
              </option>

            </select>


            <input
              type="text"
              placeholder="Localização"
              value={localizacao}
              onChange={(event) =>
                setLocalizacao(
                  event.target.value
                )
              }
            />


            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
            >

              <option value="">
                Todos os status
              </option>

              <option value="Disponível">
                Disponível
              </option>

              <option value="Em negociação">
                Em negociação
              </option>

            </select>


            <button
              type="button"
              onClick={() => {

                setCategoria("");
                setLocalizacao("");
                setStatus("");
                setBusca("");

              }}
            >
              Limpar
            </button>

          </div>


          {/* PEDIDOS */}

          <div className="feed-inicio-costureira">

            {pedidosFiltrados.length > 0 ? (

              pedidosFiltrados.map(
                (pedido) => (

                  <article
                    className="pedido-inicio-card"
                    key={pedido.id}
                  >

                    <div>

                      <div className="pedido-card-cabecalho">

                        <span className="status-pedido">
                          {pedido.status}
                        </span>

                        <small>
                          Pedido #{pedido.id}
                        </small>

                      </div>


                      <h3>
                        {pedido.titulo}
                      </h3>


                      <p className="pedido-resumo">
                        {pedido.descricao}
                      </p>


                      <div className="pedido-dados">

                        <p>

                          <strong>
                            Categoria
                          </strong>

                          <span>
                            {pedido.categoria ||
                              pedido.tipoServico}
                          </span>

                        </p>


                        <p>

                          <strong>
                            Localização
                          </strong>

                          <span>
                            {pedido.localizacao}
                          </span>

                        </p>


                        <p>

                          <strong>
                            Prazo
                          </strong>

                          <span>
                            {pedido.prazo}
                          </span>

                        </p>

                      </div>

                    </div>


                    <div className="pedido-card-acoes">

                      {pedido.status ===
                      "Disponível" ? (

                        <button
                          type="button"
                          className="btn-interesse"
                          onClick={() =>
                            demonstrarInteresse(
                              pedido.id
                            )
                          }
                        >
                          Tenho interesse
                        </button>

                      ) : (

                        <button
                          type="button"
                          className="btn-interesse"
                          disabled
                        >
                          Em negociação
                        </button>

                      )}


                      <button
                        type="button"
                        className="btn-ver-detalhes"
                        onClick={() =>
                          setPedidoSelecionado(
                            pedidoSelecionado?.id ===
                              pedido.id
                              ? null
                              : pedido
                          )
                        }
                      >
                        {pedidoSelecionado?.id ===
                        pedido.id
                          ? "Ocultar detalhes"
                          : "Ver detalhes"}
                      </button>

                    </div>


                    {pedidoSelecionado?.id ===
                      pedido.id && (

                      <div className="detalhes-pedido-expandido">

                        <div className="detalhes-pedido-expandido-titulo">

                          <span>
                            Detalhes do pedido
                          </span>

                        </div>


                        <div className="detalhes-pedido-grid">

                          <div className="detalhe-item">

                            <strong>
                              Cliente
                            </strong>

                            <span>
                              {pedido.clienteNome ||
                                "Cliente"}
                            </span>

                          </div>


                          <div className="detalhe-item">

                            <strong>
                              Tipo de serviço
                            </strong>

                            <span>
                              {pedido.tipoServico ||
                                pedido.categoria}
                            </span>

                          </div>


                          <div className="detalhe-item detalhe-completo">

                            <strong>
                              Descrição
                            </strong>

                            <p>
                              {pedido.descricao}
                            </p>

                          </div>


                          <div className="detalhe-item">

                            <strong>
                              Localização
                            </strong>

                            <span>
                              {pedido.localizacao}
                            </span>

                          </div>


                          <div className="detalhe-item">

                            <strong>
                              Prazo desejado
                            </strong>

                            <span>
                              {pedido.prazo}
                            </span>

                          </div>


                          <div className="detalhe-item detalhe-completo">

                            <strong>
                              Imagens de referência
                            </strong>

                            {pedido.imagens?.length > 0 ? (

                              <div className="detalhes-arquivos-inline">

                                {pedido.imagens.map(
                                  (imagem, index) => (

                                    <span key={index}>
                                      📎 {imagem}
                                    </span>

                                  )
                                )}

                              </div>

                            ) : (

                              <p className="sem-imagem-pedido">
                                Nenhuma imagem de referência.
                              </p>

                            )}

                          </div>

                        </div>

                      </div>

                    )}

                  </article>

                )
              )

            ) : (

              <div className="nenhum-pedido">

                <h3>
                  Nenhum pedido encontrado
                </h3>

                <p>
                  Não existem pedidos disponíveis
                  com os filtros selecionados.
                </p>

              </div>

            )}

          </div>

        </section>

      </main>

    </>
  );
}

export default FeedPedidos;