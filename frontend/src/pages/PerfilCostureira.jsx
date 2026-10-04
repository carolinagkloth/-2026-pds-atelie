import { useState } from "react";
import Header from "../components/Header";

const perfilInicial = {
  nome: "Marina Costa",
  cidade: "Ponta Grossa",
  estado: "PR",
  cep: "84000-000",
  rua: "Rua Balduíno Taques",
  numero: "000",
  bairro: "Centro",
  complemento: "Sala 02",
  especialidades: "Ajustes, vestidos de festa e peças sob medida",
  descricao:
    "Costureira especializada em ajustes, vestidos de festa e peças sob medida. Trabalho com atendimento personalizado e acabamento delicado.",
  foto: "",
};

const precosIniciais = [
  { id: 1, servico: "Barra de calça", valor: "R$ 25,00" },
  { id: 2, servico: "Troca de zíper", valor: "R$ 35,00" },
  { id: 3, servico: "Ajuste de vestido", valor: "R$ 60,00" },
  { id: 4, servico: "Peça sob medida", valor: "Sob orçamento" },
];

const portfolioInicial = [
  {
    id: 1,
    titulo: "Vestido ajustado",
    descricao: "Ajuste de cintura e comprimento para festa.",
    imagem: "",
  },
  {
    id: 2,
    titulo: "Jaqueta customizada",
    descricao: "Aplicação de detalhes bordados e ajuste das mangas.",
    imagem: "",
  },
  {
    id: 3,
    titulo: "Conjunto sob medida",
    descricao: "Peça confeccionada a partir das medidas da cliente.",
    imagem: "",
  },
];

function PerfilCostureira() {
  const [perfil, setPerfil] = useState(perfilInicial);
  const [perfilForm, setPerfilForm] = useState(perfilInicial);
  const [editandoPerfil, setEditandoPerfil] = useState(false);

  const [precos, setPrecos] = useState(precosIniciais);
  const [precosForm, setPrecosForm] = useState(precosIniciais);
  const [editandoPrecos, setEditandoPrecos] = useState(false);

  const [portfolio, setPortfolio] = useState(portfolioInicial);
  const [adicionandoTrabalho, setAdicionandoTrabalho] =
    useState(false);

  const [novoTrabalho, setNovoTrabalho] = useState({
    titulo: "",
    descricao: "",
    imagem: "",
    arquivoImagem: null,
  });

  /* =========================
     EDITAR PERFIL
  ========================= */

  function abrirEditarPerfil() {
    setPerfilForm({ ...perfil });
    setEditandoPerfil(true);
  }

  function alterarPerfil(event) {
    const { name, value } = event.target;

    setPerfilForm((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function selecionarFotoPerfil(event) {
    const arquivo = event.target.files[0];

    if (!arquivo) return;

    const preview = URL.createObjectURL(arquivo);

    setPerfilForm((anterior) => ({
      ...anterior,
      foto: preview,
      arquivoFoto: arquivo,
    }));
  }

  function salvarPerfil(event) {
    event.preventDefault();

    /*
      FUTURO BACK-END:

      await api.put("/costureiras/perfil", perfilForm);

      Depois, o setPerfil pode usar
      os dados devolvidos pela API.
    */

    setPerfil(perfilForm);
    setEditandoPerfil(false);
  }

  /* =========================
     EDITAR PREÇOS
  ========================= */

  function abrirEditarPrecos() {
    setPrecosForm(precos.map((item) => ({ ...item })));
    setEditandoPrecos(true);
  }

  function alterarPreco(id, campo, valor) {
    setPrecosForm((anteriores) =>
      anteriores.map((item) =>
        item.id === id
          ? { ...item, [campo]: valor }
          : item
      )
    );
  }

  function adicionarPreco() {
    setPrecosForm((anteriores) => [
      ...anteriores,
      {
        id: Date.now(),
        servico: "",
        valor: "",
      },
    ]);
  }

  function removerPreco(id) {
    setPrecosForm((anteriores) =>
      anteriores.filter((item) => item.id !== id)
    );
  }

  function salvarPrecos() {
    /*
      FUTURO BACK-END:

      await api.put("/costureiras/precos", {
        precos: precosForm
      });
    */

    const preenchidos = precosForm.filter(
      (item) => item.servico.trim() !== ""
    );

    setPrecos(preenchidos);
    setEditandoPrecos(false);
  }

  /* =========================
     PORTFÓLIO
  ========================= */

  function alterarNovoTrabalho(event) {
    const { name, value } = event.target;

    setNovoTrabalho((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function selecionarImagemTrabalho(event) {
    const arquivo = event.target.files[0];

    if (!arquivo) return;

    const preview = URL.createObjectURL(arquivo);

    setNovoTrabalho((anterior) => ({
      ...anterior,
      imagem: preview,
      arquivoImagem: arquivo,
    }));
  }

  function adicionarTrabalho(event) {
    event.preventDefault();

    const trabalho = {
      id: Date.now(),
      titulo: novoTrabalho.titulo,
      descricao: novoTrabalho.descricao,
      imagem: novoTrabalho.imagem,
      arquivoImagem: novoTrabalho.arquivoImagem,
    };

    /*
      FUTURO BACK-END:

      Aqui sua colega poderá usar FormData
      para enviar a foto e os dados.

      Exemplo:

      await api.post("/portfolio", formData);
    */

    setPortfolio((anterior) => [
      trabalho,
      ...anterior,
    ]);

    setNovoTrabalho({
      titulo: "",
      descricao: "",
      imagem: "",
      arquivoImagem: null,
    });

    setAdicionandoTrabalho(false);
  }

  return (
    <>
      <Header />

      <main className="perfil-costureira-page">

        {/* PERFIL */}

        <section className="perfil-topo">

          <div className="perfil-foto">
            {perfil.foto ? (
              <img
                src={perfil.foto}
                alt={`Foto de ${perfil.nome}`}
              />
            ) : (
              <span>MC</span>
            )}
          </div>

          <div className="perfil-dados">

            <h2>{perfil.nome}</h2>

            <div className="perfil-localizacao">

              <h4>Local de atendimento</h4>

              <p>
                {perfil.rua}, {perfil.numero}
              </p>

              <p>
                {perfil.bairro}
                {perfil.complemento &&
                  ` - ${perfil.complemento}`}
              </p>

              <p>
                {perfil.cidade} - {perfil.estado}
              </p>

              <p>CEP: {perfil.cep}</p>

            </div>

            <p className="perfil-especialidades-texto">
              <strong>Especialidades:</strong>{" "}
              {perfil.especialidades}
            </p>

            <p className="perfil-descricao">
              {perfil.descricao}
            </p>

            <div className="perfil-avaliacao-resumo">
              <strong>★ 4,8</strong>
              <span>37 avaliações</span>
            </div>

          </div>

          <button
            type="button"
            className="btn-editar-perfil"
            onClick={abrirEditarPerfil}
          >
            Editar perfil
          </button>

        </section>

        {/* PREÇOS E AVALIAÇÃO */}

        <section className="perfil-informacoes">

          <div className="perfil-bloco">

            <div className="perfil-bloco-titulo">

              <h3>Tabela de preços</h3>

              <button
                type="button"
                onClick={abrirEditarPrecos}
              >
                Editar preços
              </button>

            </div>

            <div className="tabela-precos">

              {precos.map((preco) => (
                <div
                  className="preco-item"
                  key={preco.id}
                >
                  <span>{preco.servico}</span>
                  <strong>{preco.valor}</strong>
                </div>
              ))}

            </div>

            <p className="preco-observacao">
              Os valores servem como referência e podem
              variar conforme o tecido, a complexidade
              e o prazo.
            </p>

          </div>

          <div className="perfil-bloco avaliacao-bloco">

            <h3>Avaliação</h3>

            <div className="avaliacao-nota">
              <strong>4,8</strong>
              <span>★★★★★</span>
            </div>

            <p>Baseado em 37 avaliações</p>

            <small>
              Avaliações feitas por clientes após
              serviços finalizados.
            </small>

          </div>

        </section>

        {/* PORTFÓLIO */}

        <section className="portfolio-section">

          <div className="portfolio-titulo">

            <div>
              <h2>Portfólio</h2>
              <p>
                Trabalhos realizados anteriormente.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setAdicionandoTrabalho(true)
              }
            >
              + Adicionar trabalho
            </button>

          </div>

          <div className="portfolio-grid">

            {portfolio.map((trabalho) => (
              <article
                className="portfolio-card"
                key={trabalho.id}
              >

                <div className="portfolio-imagem">

                  {trabalho.imagem ? (
                    <img
                      src={trabalho.imagem}
                      alt={trabalho.titulo}
                    />
                  ) : (
                    <span>Foto do trabalho</span>
                  )}

                </div>

                <div className="portfolio-conteudo">

                  <h3>{trabalho.titulo}</h3>

                  <p>{trabalho.descricao}</p>

                </div>

              </article>
            ))}

          </div>

        </section>

      </main>

      {/* =========================
          MODAL EDITAR PERFIL
      ========================= */}

      {editandoPerfil && (
        <div className="modal-overlay">

          <div className="modal-conteudo">

            <div className="modal-cabecalho">

              <h2>Editar perfil</h2>

              <button
                type="button"
                className="modal-fechar"
                onClick={() =>
                  setEditandoPerfil(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={salvarPerfil}>

              <div className="form-campo">

                <label>Foto de perfil</label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={selecionarFotoPerfil}
                />

              </div>

              <div className="form-campo">

                <label>Nome</label>

                <input
                  type="text"
                  name="nome"
                  value={perfilForm.nome}
                  onChange={alterarPerfil}
                  required
                />

              </div>

              <h3 className="form-subtitulo">
                Local de atendimento
              </h3>

              <div className="form-grid">

                <div className="form-campo">

                  <label>CEP</label>

                  <input
                    type="text"
                    name="cep"
                    value={perfilForm.cep}
                    onChange={alterarPerfil}
                  />

                </div>

                <div className="form-campo">

                  <label>Cidade</label>

                  <input
                    type="text"
                    name="cidade"
                    value={perfilForm.cidade}
                    onChange={alterarPerfil}
                    required
                  />

                </div>

                <div className="form-campo">

                  <label>Estado</label>

                  <input
                    type="text"
                    name="estado"
                    value={perfilForm.estado}
                    onChange={alterarPerfil}
                    maxLength="2"
                    required
                  />

                </div>

                <div className="form-campo">

                  <label>Rua / Avenida</label>

                  <input
                    type="text"
                    name="rua"
                    value={perfilForm.rua}
                    onChange={alterarPerfil}
                    required
                  />

                </div>

                <div className="form-campo">

                  <label>Número</label>

                  <input
                    type="text"
                    name="numero"
                    value={perfilForm.numero}
                    onChange={alterarPerfil}
                    required
                  />

                </div>

                <div className="form-campo">

                  <label>Bairro</label>

                  <input
                    type="text"
                    name="bairro"
                    value={perfilForm.bairro}
                    onChange={alterarPerfil}
                    required
                  />

                </div>

                <div className="form-campo form-campo-completo">

                  <label>Complemento</label>

                  <input
                    type="text"
                    name="complemento"
                    value={perfilForm.complemento}
                    onChange={alterarPerfil}
                  />

                </div>

              </div>

              <div className="form-campo">

                <label>Especialidades</label>

                <input
                  type="text"
                  name="especialidades"
                  value={perfilForm.especialidades}
                  onChange={alterarPerfil}
                  placeholder="Ex.: Ajustes, vestidos, bordados..."
                />

              </div>

              <div className="form-campo">

                <label>Sobre mim</label>

                <textarea
                  name="descricao"
                  value={perfilForm.descricao}
                  onChange={alterarPerfil}
                  rows="5"
                />

              </div>

              <div className="modal-acoes">

                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() =>
                    setEditandoPerfil(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-salvar"
                >
                  Salvar alterações
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =========================
          MODAL EDITAR PREÇOS
      ========================= */}

      {editandoPrecos && (
        <div className="modal-overlay">

          <div className="modal-conteudo">

            <div className="modal-cabecalho">

              <h2>Editar tabela de preços</h2>

              <button
                type="button"
                className="modal-fechar"
                onClick={() =>
                  setEditandoPrecos(false)
                }
              >
                ×
              </button>

            </div>

            <div className="editar-precos-lista">

              {precosForm.map((preco) => (

                <div
                  className="editar-preco-item"
                  key={preco.id}
                >

                  <input
                    type="text"
                    placeholder="Serviço"
                    value={preco.servico}
                    onChange={(event) =>
                      alterarPreco(
                        preco.id,
                        "servico",
                        event.target.value
                      )
                    }
                  />

                  <input
                    type="text"
                    placeholder="Valor"
                    value={preco.valor}
                    onChange={(event) =>
                      alterarPreco(
                        preco.id,
                        "valor",
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="btn-remover"
                    onClick={() =>
                      removerPreco(preco.id)
                    }
                  >
                    Remover
                  </button>

                </div>

              ))}

            </div>

            <button
              type="button"
              className="btn-adicionar-linha"
              onClick={adicionarPreco}
            >
              + Adicionar serviço
            </button>

            <div className="modal-acoes">

              <button
                type="button"
                className="btn-cancelar"
                onClick={() =>
                  setEditandoPrecos(false)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-salvar"
                onClick={salvarPrecos}
              >
                Salvar preços
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =========================
          MODAL ADICIONAR TRABALHO
      ========================= */}

      {adicionandoTrabalho && (
        <div className="modal-overlay">

          <div className="modal-conteudo">

            <div className="modal-cabecalho">

              <h2>Adicionar trabalho</h2>

              <button
                type="button"
                className="modal-fechar"
                onClick={() =>
                  setAdicionandoTrabalho(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={adicionarTrabalho}>

              <div className="form-campo">

                <label>Foto do trabalho</label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={selecionarImagemTrabalho}
                  required
                />

              </div>

              {novoTrabalho.imagem && (
                <div className="preview-trabalho">

                  <img
                    src={novoTrabalho.imagem}
                    alt="Prévia do trabalho"
                  />

                </div>
              )}

              <div className="form-campo">

                <label>Título</label>

                <input
                  type="text"
                  name="titulo"
                  value={novoTrabalho.titulo}
                  onChange={alterarNovoTrabalho}
                  placeholder="Ex.: Vestido de festa"
                  required
                />

              </div>

              <div className="form-campo">

                <label>Descrição</label>

                <textarea
                  name="descricao"
                  value={novoTrabalho.descricao}
                  onChange={alterarNovoTrabalho}
                  rows="4"
                  placeholder="Conte um pouco sobre o trabalho realizado..."
                  required
                />

              </div>

              <div className="modal-acoes">

                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() =>
                    setAdicionandoTrabalho(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-salvar"
                >
                  Adicionar ao portfólio
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </>
  );
}

export default PerfilCostureira;