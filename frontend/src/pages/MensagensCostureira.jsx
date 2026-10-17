import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HeaderCostureira from "../components/HeaderCostureira";

function MensagensCostureira() {

  const [searchParams] =
    useSearchParams();

  const usuarioSalvo =
    localStorage.getItem("usuario");

  const usuario = usuarioSalvo
    ? JSON.parse(usuarioSalvo)
    : null;

  const idCostureira =
  usuario?.tipo_usuario === "Costureira"
    ? usuario?.id_usuario || usuario?.id
    : "costureira-local";


  const pedidosSalvos =
    JSON.parse(
      localStorage.getItem(
        "pedidosCliente"
      ) || "[]"
    );


  const pedidosEmNegociacao =
  pedidosSalvos.filter((pedido) => {

    if (
      pedido.status !==
      "Em negociação"
    ) {
      return false;
    }

    const pedidoSemCostureira =
      !pedido.id_costureira;

    const pedidoTesteAntigo =
      pedido.id_costureira ===
      "costureira-local";

    const pedidoDaCostureiraAtual =
      String(
        pedido.id_costureira
      ) ===
      String(idCostureira);

    return (
      pedidoSemCostureira ||
      pedidoTesteAntigo ||
      pedidoDaCostureiraAtual
    );
  });


  const pedidoInicial =
    searchParams.get("pedido");


  const [
    pedidoConversaId,
    setPedidoConversaId,
  ] = useState(
    pedidoInicial || null
  );


  const [
    textoMensagem,
    setTextoMensagem,
  ] = useState("");


  const [
    mensagens,
    setMensagens,
  ] = useState(() => {

    const salvas =
      localStorage.getItem(
        "mensagensPedidos"
      );

    return salvas
      ? JSON.parse(salvas)
      : {};
  });


  const pedidoConversa =
    pedidosEmNegociacao.find(
      (pedido) =>
        String(pedido.id) ===
        String(pedidoConversaId)
    );


  useEffect(() => {

    function sincronizarMensagens(event) {

      if (
        event.key ===
        "mensagensPedidos"
      ) {

        setMensagens(
          event.newValue
            ? JSON.parse(
                event.newValue
              )
            : {}
        );
      }
    }

    window.addEventListener(
      "storage",
      sincronizarMensagens
    );

    return () =>
      window.removeEventListener(
        "storage",
        sincronizarMensagens
      );

  }, []);


  function enviarMensagem(event) {

    event.preventDefault();

    const conteudo =
      textoMensagem.trim();

    if (
      !conteudo ||
      !pedidoConversaId
    ) {
      return;
    }


    const novaMensagem = {

      id_mensagem:
        Date.now(),

      id_pedido:
        pedidoConversaId,

      id_remetente:
        idCostureira,

      nome_remetente:
        usuario?.nome ||
        "Costureira",

      tipo_remetente:
        "Costureira",

      conteudo,

      data_hora_envio:
        new Date().toISOString(),

    };


    setMensagens((anterior) => {

      const atualizadas = {

        ...anterior,

        [pedidoConversaId]: [

          ...(anterior[
            pedidoConversaId
          ] || []),

          novaMensagem,

        ],
      };


      localStorage.setItem(
        "mensagensPedidos",
        JSON.stringify(
          atualizadas
        )
      );


      return atualizadas;
    });


    setTextoMensagem("");
  }


  return (
    <>
      <HeaderCostureira />

      <main className="cliente-page">

        <section className="mensagens-cliente">

          <div className="mensagens-cabecalho">

            <span>
              Negociações
            </span>

            <h1>
              Mensagens
            </h1>

            <p>
              Converse com os clientes
              dos pedidos que você aceitou.
            </p>

          </div>


          <div className="mensagens-layout">

            <aside className="conversas-lista">

              <div className="conversas-lista-titulo">

                <h2>
                  Suas negociações
                </h2>

                <small>
                  {
                    pedidosEmNegociacao.length
                  } conversa(s)
                </small>

              </div>


              {pedidosEmNegociacao.length ===
              0 ? (

                <div className="conversas-vazio">

                  <p>
                    Você ainda não possui
                    pedidos em negociação.
                  </p>

                </div>

              ) : (

                pedidosEmNegociacao.map(
                  (pedido) => (

                    <button
                      key={pedido.id}
                      type="button"
                      className={
                        String(
                          pedidoConversaId
                        ) ===
                        String(pedido.id)

                          ? "conversa-item ativo"

                          : "conversa-item"
                      }
                      onClick={() =>
                        setPedidoConversaId(
                          pedido.id
                        )
                      }
                    >

                      <div className="conversa-item-topo">

                        <strong>
                          {pedido.titulo}
                          {" - "}
                          {pedido.clienteNome ||
                            "Cliente"}
                        </strong>

                        <small>
                          #{pedido.id}
                        </small>

                      </div>

                      <p>
                        {pedido.tipoServico ||
                          pedido.categoria}
                      </p>

                      <span>
                        Em negociação
                      </span>

                    </button>

                  )
                )

              )}

            </aside>


            <div className="chat-cliente">

              {!pedidoConversa ? (

                <div className="chat-sem-conversa">

                  <div className="chat-sem-conversa-icone">
                    💬
                  </div>

                  <h2>
                    Selecione uma conversa
                  </h2>

                  <p>
                    Escolha uma negociação
                    para conversar com o cliente.
                  </p>

                </div>

              ) : (

                <>

                  <div className="chat-cabecalho">

                    <div>

                      <small>
                        Pedido #
                        {pedidoConversa.id}
                      </small>

                      <h2>
                        {pedidoConversa.titulo}
                        {" - "}
                        {pedidoConversa.clienteNome ||
                          "Cliente"}
                      </h2>

                    </div>

                    <span className="chat-status">
                      Em negociação
                    </span>

                  </div>


                  <div className="chat-mensagens">

                    {(mensagens[
                      pedidoConversaId
                    ] || []).length === 0 ? (

                      <div className="chat-inicio-conversa">

                        <p>
                          Nenhuma mensagem ainda.
                        </p>

                        <small>
                          Envie uma mensagem
                          para iniciar a negociação.
                        </small>

                      </div>

                    ) : (

                      mensagens[
                        pedidoConversaId
                      ].map(
                        (mensagem) => {

                          const minhaMensagem =
                            mensagem.tipo_remetente ===
                            "Costureira";

                          return (

                            <div
                              key={
                                mensagem.id_mensagem
                              }
                              className={
                                minhaMensagem
                                  ? "mensagem-balao mensagem-cliente-balao"
                                  : "mensagem-balao mensagem-outro-balao"
                              }
                            >

                              <strong className="mensagem-remetente">
                                {
                                  mensagem.nome_remetente
                                }
                              </strong>

                              <p>
                                {mensagem.conteudo}
                              </p>

                              <small>
                                {new Date(
                                  mensagem.data_hora_envio
                                ).toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </small>

                            </div>

                          );
                        }
                      )

                    )}

                  </div>


                  <form
                    className="chat-envio"
                    onSubmit={enviarMensagem}
                  >

                    <input
                      type="text"
                      value={textoMensagem}
                      onChange={(event) =>
                        setTextoMensagem(
                          event.target.value
                        )
                      }
                      placeholder="Digite uma mensagem..."
                    />

                    <button type="submit">
                      Enviar
                    </button>

                  </form>

                </>

              )}

            </div>

          </div>

        </section>

      </main>
    </>
  );
}

export default MensagensCostureira;