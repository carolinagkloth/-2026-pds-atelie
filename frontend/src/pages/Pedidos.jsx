import HeaderCostureira from "../components/HeaderCostureira";

function Pedidos() {

  const pedidosSalvos =
    JSON.parse(
      localStorage.getItem("pedidosCliente") || "[]"
    );

  const novasOportunidades =
    pedidosSalvos.filter(
      (pedido) =>
        pedido.status === "Disponível"
    ).length;

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

            <h1>
              Olá, Marina!
            </h1>

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

            <span>
              Trabalhos em andamento
            </span>

            <strong>
              2
            </strong>

            <small>
              Serviços atualmente em produção
            </small>

          </article>


          <article className="resumo-card">

            <span>
              Próxima prova
            </span>

            <strong>
              08 OUT
            </strong>

            <small>
              Vestido de festa · 14h
            </small>

          </article>


          <article className="resumo-card">

            <span>
              Novas oportunidades
            </span>

            <strong>
              {novasOportunidades}
            </strong>

            <small>
              Pedidos disponíveis no momento
            </small>

          </article>

        </section>

      </main>
    </>
  );
}

export default Pedidos;