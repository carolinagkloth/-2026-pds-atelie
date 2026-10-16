import { useRef, useState } from "react";
import HeaderCliente from "../components/HeaderCliente";

function Cliente() {
  const [tela, setTela] = useState("inicio");
  const [formularioAberto, setFormularioAberto] =
    useState(false);
  const [salvando, setSalvando] = useState(false);

  const [pedidoConversaId, setPedidoConversaId] =
    useState(null);

  const [textoMensagem, setTextoMensagem] =
    useState("");

  const [mensagensLocais, setMensagensLocais] =
  useState(() => {

    const mensagensSalvas =
      localStorage.getItem(
        "mensagensPedidos"
      );

    return mensagensSalvas
      ? JSON.parse(
          mensagensSalvas
        )
      : {};
  });

  const calendarioRef = useRef(null);

  const usuarioSalvo =
    localStorage.getItem("usuario");

  const usuario = usuarioSalvo
    ? JSON.parse(usuarioSalvo)
    : null;

  const [pedidos, setPedidos] = useState(() => {
    const pedidosSalvos =
      localStorage.getItem("pedidosCliente");

    return pedidosSalvos
      ? JSON.parse(pedidosSalvos)
      : [];
  });

  const [formulario, setFormulario] =
    useState({
      titulo: "",
      tipoServico: "",
      descricao: "",
      prazo: "",
      prazoISO: "",
      localizacao: "",
      imagens: [],
    });

  const pedidosAtivos = pedidos.filter(
    (pedido) =>
      pedido.status !== "Finalizado" &&
      pedido.status !== "Concluído"
  );

  const pedidosFinalizados = pedidos.filter(
    (pedido) =>
      pedido.status === "Finalizado" ||
      pedido.status === "Concluído"
  );

  const pedidosEmNegociacao = pedidos.filter(
  (pedido) =>
    pedido.status === "Em negociação"
);


  function obterIdPedido(pedido) {
    return pedido.id ?? pedido.id_pedido;
  }

  const pedidoConversa = pedidosEmNegociacao.find(
  (pedido) =>
    String(obterIdPedido(pedido)) ===
    String(pedidoConversaId)
);

  function alterarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function selecionarImagens(event) {
    const arquivos =
      Array.from(event.target.files);

    setFormulario((anterior) => ({
      ...anterior,
      imagens: arquivos,
    }));
  }

  function abrirCalendario() {
    const calendario =
      calendarioRef.current;

    if (!calendario) return;

    if (calendario.showPicker) {
      calendario.showPicker();
    } else {
      calendario.click();
    }
  }

  function selecionarPrazo(event) {
    const valor =
      event.target.value;

    if (!valor) {
      setFormulario((anterior) => ({
        ...anterior,
        prazo: "",
        prazoISO: "",
      }));

      return;
    }

    const [ano, mes, dia] =
      valor.split("-");

    setFormulario((anterior) => ({
      ...anterior,
      prazo: `${dia}/${mes}/${ano}`,
      prazoISO: valor,
    }));
  }

  function enviarMensagem(event) {
    event.preventDefault();

    const texto =
      textoMensagem.trim();

    if (!texto || !pedidoConversaId) {
      return;
    }

    const novaMensagem = {

    id_mensagem:
      Date.now(),

    id_pedido:
      pedidoConversaId,

    id_remetente:
      usuario?.id_usuario ||
      usuario?.id ||
      "cliente-local",

    nome_remetente:
      usuario?.nome ||
      "Cliente",

    tipo_remetente:
      "Cliente",

    conteudo:
      texto,

    data_hora_envio:
      new Date().toISOString(),

  };

    setMensagensLocais((anterior) => {

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

  async function publicarPedido(event) {
    event.preventDefault();

    setSalvando(true);

    const nomesImagens =
      formulario.imagens.map(
        (imagem) => imagem.name
      );

    const novoPedido = {
      id: Date.now(),
      id_cliente:
        usuario?.id_usuario ||
        usuario?.id ||
        null,

      clienteNome:
        usuario?.nome ||
        "Cliente",

      titulo:
        formulario.titulo,

      categoria:
        formulario.tipoServico,

      tipoServico:
        formulario.tipoServico,

      descricao:
        formulario.descricao,

      prazo:
        formulario.prazo,

      prazoISO:
        formulario.prazoISO,

      localizacao:
        formulario.localizacao,

      imagens:
        nomesImagens,

      status:
        "Disponível",

      criadoEm:
        new Date().toISOString(),
    };

    try {
      const token =
        localStorage.getItem("token");

      const resposta = await fetch(
        "http://localhost:3000/api/pedidos",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            id_cliente:
              usuario?.id_usuario ||
              usuario?.id,

            descricao:
              formulario.descricao,

            prazo_desejado:
              formulario.prazoISO,

            fotos_referencia:
              JSON.stringify(
                nomesImagens
              ),
          }),
        }
      );

      if (resposta.ok) {
        const dados =
          await resposta.json();

        if (dados.id_pedido) {
          novoPedido.id =
            dados.id_pedido;
        }
      }
    } catch (erro) {
      console.log(
        "Back-end ainda não disponível:",
        erro
      );
    }

    const novaLista = [
      novoPedido,
      ...pedidos,
    ];

    setPedidos(novaLista);

    localStorage.setItem(
      "pedidosCliente",
      JSON.stringify(novaLista)
    );

    setFormulario({
      titulo: "",
      tipoServico: "",
      descricao: "",
      prazo: "",
      prazoISO: "",
      localizacao: "",
      imagens: [],
    });

    setSalvando(false);
    setFormularioAberto(false);
    setTela("pedidos");
  }

  return (
    <>
      <HeaderCliente
        telaAtual={tela}

        onAbrirInicio={() => {
          setTela("inicio");
          setFormularioAberto(false);
        }}

        onAbrirMeusPedidos={() => {
          setTela("pedidos");
          setFormularioAberto(false);
        }}

        onAbrirMensagens={() => {
          setTela("mensagens");
          setFormularioAberto(false);
        }}

      />

      <main className="cliente-page">

        {/* =========================
            INÍCIO
        ========================= */}

        {tela === "inicio" && (
          <>
            {!formularioAberto ? (
              <>

                <section className="cliente-topo">
                  <div>

                    <span className="cliente-legenda">
                      Área do cliente
                    </span>

                    <h1>
                      Olá
                      {usuario?.nome
                        ? `, ${usuario.nome}`
                        : ""}
                      !
                    </h1>

                    <p>
                      Acompanhe seus serviços e publique
                      novos pedidos em um só lugar.
                    </p>

                    <button
                      type="button"
                      className="btn-novo-pedido"
                      onClick={() =>
                        setFormularioAberto(true)
                      }
                    >
                      + Novo pedido
                    </button>

                  </div>
                </section>

                <section className="cliente-resumo">

                  <article className="cliente-resumo-card">

                    <span>
                      Pedidos ativos
                    </span>

                    <strong>
                      {pedidosAtivos.length}
                    </strong>

                    <small>
                      Pedidos aguardando ou em andamento
                    </small>

                  </article>

                  <article className="cliente-resumo-card">

                    <span>
                      Pedidos anteriores
                    </span>

                    <strong>
                      {pedidosFinalizados.length}
                    </strong>

                    <small>
                      Serviços já finalizados
                    </small>

                  </article>

                </section>

              </>
            ) : (

              <section className="novo-pedido-area">

                <div className="novo-pedido-cabecalho">

                  <span>
                    Nova solicitação
                  </span>

                  <h2>
                    Publicar pedido
                  </h2>

                  <p>
                    Informe os detalhes do serviço
                    que você precisa.
                  </p>

                </div>

                <form
                  className="novo-pedido-form"
                  onSubmit={publicarPedido}
                >

                  <div className="form-campo">

                    <label>
                      Título do pedido
                    </label>

                    <input
                      type="text"
                      name="titulo"
                      value={formulario.titulo}
                      onChange={alterarCampo}
                      placeholder="Ex.: Ajuste em vestido de festa"
                      required
                    />

                  </div>

                  <div className="form-campo">

                    <label>
                      Tipo de serviço
                    </label>

                    <select
                      name="tipoServico"
                      value={formulario.tipoServico}
                      onChange={alterarCampo}
                      required
                    >

                      <option value="">
                        Selecione
                      </option>

                      <option value="Ajustes">
                        Ajustes
                      </option>

                      <option value="Consertos">
                        Consertos
                      </option>

                      <option value="Sob medida">
                        Confecção sob medida
                      </option>

                      <option value="Customização">
                        Customização
                      </option>

                      <option value="Bordados">
                        Bordados e acabamentos
                      </option>

                      <option value="Outros">
                        Outros
                      </option>

                    </select>

                  </div>

                  <div className="form-campo">

                    <label>
                      Descrição do serviço
                    </label>

                    <textarea
                      name="descricao"
                      value={formulario.descricao}
                      onChange={alterarCampo}
                      rows="6"
                      placeholder="Descreva a peça, o ajuste desejado, tecido, medidas ou outras informações importantes."
                      required
                    />

                  </div>

                  <div className="form-grid">

                    <div className="form-campo">

                      <label>
                        Localização
                      </label>

                      <input
                        type="text"
                        name="localizacao"
                        value={formulario.localizacao}
                        onChange={alterarCampo}
                        placeholder="Ex.: Ponta Grossa - PR"
                        required
                      />

                    </div>

                    <div className="form-campo">

                      <label>
                        Prazo desejado
                      </label>

                      <div className="campo-data-personalizado">

                        <input
                          type="text"
                          value={formulario.prazo}
                          placeholder="DD/MM/AAAA"
                          readOnly
                          required
                          onClick={abrirCalendario}
                          className="campo-data-visivel"
                        />

                        <input
                          ref={calendarioRef}
                          type="date"
                          value={formulario.prazoISO}
                          onChange={selecionarPrazo}
                          className="calendario-invisivel"
                          tabIndex="-1"
                        />

                        <button
                          type="button"
                          className="botao-calendario"
                          onClick={abrirCalendario}
                          aria-label="Abrir calendário"
                          title="Escolher data"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              d="M7 2v3M17 2v3M3.5 9h17M5.5 4.5h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                      </div>

                    </div>

                  </div>

                  <div className="form-campo">

                    <label>
                      Imagens de referência
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={selecionarImagens}
                    />

                    <small className="campo-ajuda">
                      Você pode selecionar fotos da peça
                      ou imagens de referência.
                    </small>

                  </div>

                  {formulario.imagens.length > 0 && (
                    <div className="imagens-selecionadas">

                      <strong>
                        Imagens selecionadas:
                      </strong>

                      {formulario.imagens.map(
                        (imagem) => (
                          <span key={imagem.name}>
                            {imagem.name}
                          </span>
                        )
                      )}

                    </div>
                  )}

                  <div className="novo-pedido-acoes">

                    <button
                      type="button"
                      className="btn-cancelar"
                      onClick={() =>
                        setFormularioAberto(false)
                      }
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="btn-salvar"
                      disabled={salvando}
                    >
                      {salvando
                        ? "Publicando..."
                        : "Publicar pedido"}
                    </button>

                  </div>

                </form>

              </section>
            )}
          </>
        )}

        {/* =========================
            MEUS PEDIDOS
        ========================= */}

        {tela === "pedidos" && (
          <>

            <section className="cliente-secao-pedidos">

              <div className="cliente-secao-titulo">

                <span>
                  Seus serviços
                </span>

                <h1>
                  Meus pedidos
                </h1>

                <p>
                  Acompanhe seus pedidos atuais e
                  consulte serviços anteriores.
                </p>

              </div>

              <h2 className="titulo-grupo-pedidos">
                Pedidos ativos
              </h2>

              {pedidosAtivos.length === 0 ? (

                <div className="cliente-estado-vazio">

                  <h3>
                    Nenhum pedido ativo
                  </h3>

                  <p>
                    Quando você publicar um pedido,
                    ele aparecerá aqui.
                  </p>

                </div>

              ) : (

                <div className="cliente-lista-pedidos">

                  {pedidosAtivos.map(
                    (pedido) => (

                      <article
                        className="cliente-pedido-card"
                        key={obterIdPedido(pedido)}
                      >

                        <div className="cliente-pedido-topo">

                          <span>
                            Pedido #
                            {obterIdPedido(pedido)}
                          </span>

                          <strong>
                            {pedido.status}
                          </strong>

                        </div>

                        <h3>
                          {pedido.titulo}
                        </h3>

                        <p>
                          {pedido.descricao}
                        </p>

                        <div className="cliente-pedido-info">

                          <span>
                            {pedido.categoria}
                          </span>

                          <span>
                            {pedido.localizacao}
                          </span>

                          <span>
                            Prazo: {pedido.prazo}
                          </span>

                        </div>

                        {pedido.imagens?.length > 0 && (
                          <div className="pedido-imagens-info">
                            {pedido.imagens.length}{" "}
                            imagem(ns) de referência
                          </div>
                        )}

                      </article>
                    )
                  )}

                </div>
              )}

            </section>

            <section className="cliente-secao-pedidos">

              <div className="cliente-secao-titulo">

                <span>
                  Histórico
                </span>

                <h2>
                  Pedidos anteriores
                </h2>

              </div>

              {pedidosFinalizados.length === 0 ? (

                <div className="cliente-estado-vazio pequeno">

                  <h3>
                    Nenhum serviço finalizado
                  </h3>

                  <p>
                    Seus pedidos concluídos
                    aparecerão aqui.
                  </p>

                </div>

              ) : (

                <div className="cliente-lista-pedidos">

                  {pedidosFinalizados.map(
                    (pedido) => (

                      <article
                        className="cliente-pedido-card"
                        key={obterIdPedido(pedido)}
                      >

                        <h3>
                          {pedido.titulo}
                        </h3>

                        <p>
                          {pedido.descricao}
                        </p>

                        <span className="pedido-finalizado">
                          Serviço finalizado
                        </span>

                      </article>
                    )
                  )}

                </div>
              )}

            </section>

          </>
        )}

        {/* =========================
            MENSAGENS
        ========================= */}

        {tela === "mensagens" && (
          <section className="mensagens-cliente">

            <div className="mensagens-cabecalho">

              <span>
                Conversas
              </span>

              <h1>
                Mensagens
              </h1>

              <p>
                Converse sobre detalhes,
                prazos e andamento dos seus pedidos.
              </p>

            </div>

            <div className="mensagens-layout">

              {/* LISTA DE CONVERSAS */}

              <aside className="conversas-lista">

                <div className="conversas-lista-titulo">
                  <h2>Seus pedidos</h2>
                  <small>
                    {pedidosEmNegociacao.length} conversa(s)
                  </small>
                </div>

                {pedidosEmNegociacao.length === 0 ? (

                  <div className="conversas-vazio">
                    <p>
                      Você ainda não possui pedidos
                      para iniciar uma conversa.
                    </p>
                  </div>

                ) : (

                  pedidosEmNegociacao.map((pedido) => {

                    const id =
                      obterIdPedido(pedido);

                    return (
                      <button
                        type="button"
                        key={id}
                        className={
                          String(pedidoConversaId) ===
                          String(id)
                            ? "conversa-item ativo"
                            : "conversa-item"
                        }
                        onClick={() =>
                          setPedidoConversaId(id)
                        }
                      >

                        <div className="conversa-item-topo">

                          <strong>
                            {pedido.titulo ||
                              `Pedido #${id}`}
                            {" - "}
                            {pedido.clienteNome ||
                              usuario?.nome ||
                              "Cliente"}
                          </strong>

                          <small>
                            #{id}
                          </small>

                        </div>

                        <p>
                          {pedido.tipoServico ||
                            pedido.categoria ||
                            "Serviço"}
                        </p>

                        <span>
                          {pedido.status}
                        </span>

                      </button>
                    );
                  })

                )}

              </aside>

              {/* ÁREA DO CHAT */}

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
                      Escolha um pedido ao lado para
                      visualizar e enviar mensagens.
                    </p>

                  </div>

                ) : (
                  <>

                    <div className="chat-cabecalho">

                      <div>

                        <small>
                          Pedido #
                          {obterIdPedido(
                            pedidoConversa
                          )}
                        </small>

                        <h2>
                          {pedidoConversa.titulo ||
                            "Conversa do pedido"}
                        </h2>

                      </div>

                      <span className="chat-status">
                        {pedidoConversa.status}
                      </span>

                    </div>

                    <div className="chat-mensagens">

                      {(mensagensLocais[
                        pedidoConversaId
                      ] || []).length === 0 ? (

                        <div className="chat-inicio-conversa">

                          <p>
                            Nenhuma mensagem nesta
                            conversa ainda.
                          </p>

                          <small>
                            Envie uma mensagem para
                            iniciar a conversa sobre
                            este pedido.
                          </small>

                        </div>

                      ) : (

                        mensagensLocais[
                          pedidoConversaId
                        ].map((mensagem) => (

                          <div
                            key={mensagem.id}
                            className="mensagem-balao mensagem-cliente-balao"
                          >

                            <p>
                              {mensagem.conteudo}
                            </p>

                            <small>
                              {new Date(
                                  mensagem.data_hora_envio).toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                            </small>

                          </div>

                        ))

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
        )}

      </main>
    </>
  );
}

export default Cliente;