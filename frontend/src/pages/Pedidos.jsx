import { useState } from "react";
import HeaderCostureira from "../components/HeaderCostureira";

const pedidosMock = [
  {
    id: 1,
    titulo: "Conserto de zíper",
    descricao:
      "Cliente precisa trocar o zíper de uma saia para uso em evento no fim de semana.",
    categoria: "Consertos",
    localizacao: "Centro - Ponta Grossa, PR",
    prazo: "3 dias",
    status: "Urgente",
  },
  {
    id: 2,
    titulo: "Customização de jaqueta",
    descricao:
      "Cliente deseja aplicar detalhes bordados e pequenas alterações em uma jaqueta jeans.",
    categoria: "Customização",
    localizacao: "Uvaranas - Ponta Grossa, PR",
    prazo: "10 dias",
    status: "Disponível",
  },
  {
    id: 3,
    titulo: "Barra de vestido longo",
    descricao:
      "Cliente procura ajuste de comprimento em vestido longo para festa.",
    categoria: "Ajustes",
    localizacao: "Ponta Grossa - PR",
    prazo: "7 dias",
    status: "Disponível",
  },
  {
    id: 4,
    titulo: "Blusa personalizada",
    descricao:
      "Cliente quer confeccionar uma blusa personalizada com medidas específicas.",
    categoria: "Sob medida",
    localizacao: "Centro - Ponta Grossa, PR",
    prazo: "20 dias",
    status: "Disponível",
  },
];

function Pedidos() {
  const [categoria, setCategoria] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [status, setStatus] = useState("");
  const [busca, setBusca] = useState("");

  const pedidosFiltrados = pedidosMock.filter((pedido) => {
    const categoriaCorresponde =
      categoria === "" ||
      pedido.categoria === categoria;

    const localizacaoCorresponde =
      localizacao === "" ||
      pedido.localizacao
        .toLowerCase()
        .includes(localizacao.toLowerCase());

    const statusCorresponde =
      status === "" ||
      pedido.status === status;

    const buscaCorresponde =
      busca === "" ||
      pedido.titulo
        .toLowerCase()
        .includes(busca.toLowerCase()) ||
      pedido.descricao
        .toLowerCase()
        .includes(busca.toLowerCase());

    return (
      categoriaCorresponde &&
      localizacaoCorresponde &&
      statusCorresponde &&
      buscaCorresponde
    );
  });

  return (
    <>
      <HeaderCostureira />

      <main className="inicio-costureira">

        {/* BOAS-VINDAS */}

        <section className="boas-vindas-costureira">
          <div>
            <span className="boas-vindas-legenda">
              Área da costureira
            </span>

            <h1>Olá, Marina!</h1>

            <p>
              Encontre novos pedidos e organize seus
              trabalhos em um só lugar.
            </p>
          </div>

          <a
            href="/perfil-costureira"
            className="atalho-perfil"
          >
            Ver meu perfil
          </a>
        </section>


        {/* RESUMO */}

        <section className="resumo-costureira">

          <article className="resumo-card">
            <span>Trabalhos em andamento</span>
            <strong>2</strong>
            <small>Serviços atualmente em produção</small>
          </article>

          <article className="resumo-card">
            <span>Próxima prova</span>
            <strong>08 OUT</strong>
            <small>Vestido de festa · 14h</small>
          </article>

          <article className="resumo-card">
            <span>Novas oportunidades</span>
            <strong>{pedidosMock.length}</strong>
            <small>Pedidos disponíveis no momento</small>
          </article>

        </section>


        {/* PEDIDOS */}

        <section className="inicio-pedidos">

          <div className="inicio-pedidos-cabecalho">

            <div>
              <span className="secao-legenda">
                Novas oportunidades
              </span>

              <h2>Pedidos disponíveis</h2>

              <p>
                Encontre serviços que combinam com
                suas especialidades.
              </p>
            </div>

            <span className="quantidade-pedidos">
              {pedidosFiltrados.length} encontrados
            </span>

          </div>


          {/* BUSCA */}

          <div className="barra-busca-pedidos">

            <input
              type="text"
              placeholder="Buscar pedido..."
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
            />

          </div>


          {/* FILTROS */}

          <div className="filtros-inicio">

            <select
              value={categoria}
              onChange={(event) =>
                setCategoria(event.target.value)
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
                setLocalizacao(event.target.value)
              }
            />


            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              <option value="">
                Todos os status
              </option>

              <option value="Disponível">
                Disponível
              </option>

              <option value="Urgente">
                Urgente
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


          {/* CARDS */}

          <div className="feed-inicio-costureira">

            {pedidosFiltrados.length > 0 ? (

              pedidosFiltrados.map((pedido) => (

                <article
                  className="pedido-inicio-card"
                  key={pedido.id}
                >

                  <div>

                    <div className="pedido-card-cabecalho">

                      <span
                        className={
                          pedido.status === "Urgente"
                            ? "status-pedido urgente"
                            : "status-pedido"
                        }
                      >
                        {pedido.status}
                      </span>

                      <small>
                        Pedido #{pedido.id}
                      </small>

                    </div>


                    <h3>{pedido.titulo}</h3>


                    <p className="pedido-resumo">
                      {pedido.descricao}
                    </p>


                    <div className="pedido-dados">

                      <p>
                        <strong>Categoria</strong>
                        <span>
                          {pedido.categoria}
                        </span>
                      </p>

                      <p>
                        <strong>Localização</strong>
                        <span>
                          {pedido.localizacao}
                        </span>
                      </p>

                      <p>
                        <strong>Prazo</strong>
                        <span>
                          {pedido.prazo}
                        </span>
                      </p>

                    </div>

                  </div>


                  <div className="pedido-card-acoes">

                    <button
                      type="button"
                      className="btn-interesse"
                    >
                      Tenho interesse
                    </button>

                    <button
                      type="button"
                      className="btn-ver-detalhes"
                    >
                      Ver detalhes
                    </button>

                  </div>

                </article>

              ))

            ) : (

              <div className="nenhum-pedido">

                <h3>
                  Nenhum pedido encontrado
                </h3>

                <p>
                  Tente alterar os filtros utilizados.
                </p>

              </div>

            )}

          </div>

        </section>

      </main>
    </>
  );
}

export default Pedidos;