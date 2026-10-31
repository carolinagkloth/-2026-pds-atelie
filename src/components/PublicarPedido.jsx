import React, { useState } from 'react';
import "../styles/PublicarPedido.css";

function PublicarPedido({
  usuario,
  usuarioLogado,
  onNavigate,
  onPublicarSucesso
}) {
  const sessaoSalva = JSON.parse(
    localStorage.getItem('usuarioAtelie') || '{}'
  );

  const user = usuario || usuarioLogado || sessaoSalva;

  const [tiposervico, setTiposervico] = useState('Ajuste / Conserto');
  const [descricao, setDescricao] = useState('');
  const [prazoDesejado, setPrazoDesejado] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [previewFoto, setPreviewFoto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const hoje = new Date().toISOString().split('T')[0];

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setPreviewFoto(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!descricao || !prazoDesejado || !localizacao) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    const idCliente = user?.id_usuario || user?.id;

    if (!idCliente) {
      alert(
        'Sessão expirada ou usuário não identificado. Faça login novamente.'
      );
      return;
    }

    setCarregando(true);

    try {
      const descricaoFormatada =
        `[${tiposervico}] - Localização: ${localizacao}\n\n${descricao}`;

      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_cliente: idCliente,
          descricao: descricaoFormatada,
          fotos_referencia: previewFoto || null,
          prazo_desejado: prazoDesejado
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro || 'Erro ao publicar o pedido.'
        );
      }

      const novoPedido = data.pedido || {
        id: Date.now(),
        clienteId: idCliente,
        clienteNome: user?.nome || 'Cliente',
        tiposervico,
        descricao,
        prazoDesejado,
        localizacao,
        fotoReferencia: previewFoto || null,
        status: 'Aberto',
        dataPublicacao: new Date().toLocaleDateString()
      };

      if (onPublicarSucesso) {
        onPublicarSucesso(novoPedido);
      }

      alert('Pedido publicado com sucesso!');

      if (onNavigate) {
        onNavigate('meusPedidos');
      }
    } catch (err) {
      setErro(err.message);
      alert(`Erro: ${err.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="publicar-page">

      <section className="publicar-page-header">

        <div>
          <span className="publicar-eyebrow">
            Nova solicitação
          </span>

          <h1>
            Publicar pedido
          </h1>

          <p>
            Conte o que você precisa e adicione as informações
            necessárias para que uma costureira possa avaliar seu pedido.
          </p>
        </div>

        <button
          type="button"
          className="publicar-voltar"
          onClick={() =>
            onNavigate && onNavigate('meusPedidos')
          }
        >
          Voltar para meus pedidos
        </button>

      </section>


      <section className="publicar-card">

        <div className="publicar-card-header">

          <div>
            <span className="publicar-card-etiqueta">
              Detalhes do pedido
            </span>

            <h2>
              O que você precisa?
            </h2>
          </div>

          <span className="publicar-obrigatorios">
            * Campos obrigatórios
          </span>

        </div>


        {erro && (
          <div className="publicar-erro">
            {erro}
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="publicar-form"
        >

          <div className="publicar-form-group">

            <label>
              Tipo de serviço *
            </label>

            <span className="publicar-ajuda">
              Escolha a categoria que melhor representa sua solicitação.
            </span>

            <select
              value={tiposervico}
              onChange={(e) =>
                setTiposervico(e.target.value)
              }
            >
              <option value="Ajuste / Conserto">
                Ajuste / Conserto
              </option>

              <option value="Confecção sob Medida">
                Confecção sob Medida
              </option>

              <option value="Customização / Bordado">
                Customização / Bordado
              </option>

              <option value="Vestido de Festa">
                Vestido de Festa
              </option>
            </select>

          </div>


          <div className="publicar-form-group">

            <label>
              Descrição detalhada *
            </label>

            <span className="publicar-ajuda">
              Explique o serviço, a peça e qualquer detalhe importante.
            </span>

            <textarea
              rows="5"
              value={descricao}
              onChange={(e) =>
                setDescricao(e.target.value)
              }
              placeholder="Ex.: Preciso fazer a barra de uma calça jeans e ajustar aproximadamente 2 cm na cintura..."
              required
            />

          </div>


          <div className="publicar-duas-colunas">

            <div className="publicar-form-group">

              <label>
                Prazo desejado *
              </label>

              <span className="publicar-ajuda">
                Quando você gostaria de receber a peça?
              </span>

              <input
                type="date"
                min={hoje}
                value={prazoDesejado}
                onChange={(e) =>
                  setPrazoDesejado(e.target.value)
                }
                required
              />

            </div>


            <div className="publicar-form-group">

              <label>
                Bairro / Localização *
              </label>

              <span className="publicar-ajuda">
                Informe uma região aproximada.
              </span>

              <input
                type="text"
                value={localizacao}
                onChange={(e) =>
                  setLocalizacao(e.target.value)
                }
                placeholder="Ex.: Centro - Ponta Grossa"
                required
              />

            </div>

          </div>


          <div className="publicar-form-group">

            <label>
              Foto de referência
            </label>

            <span className="publicar-ajuda">
              Opcional. Adicione uma imagem da peça ou uma referência
              do resultado que você deseja.
            </span>

            <div className="publicar-upload-area">

              <div className="publicar-upload-texto">

                <strong>
                  Adicionar imagem
                </strong>

                <span>
                  PNG ou JPG
                </span>

              </div>

              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
              />

            </div>


            {previewFoto && (

              <div className="publicar-preview">

                <div className="publicar-preview-header">

                  <span>
                    Pré-visualização
                  </span>

                  <span className="publicar-preview-ok">
                    Imagem adicionada
                  </span>

                </div>

                <img
                  src={previewFoto}
                  alt="Pré-visualização"
                />

              </div>

            )}

          </div>


          <div className="publicar-form-footer">

            <p>
              Revise as informações antes de publicar.
              Você poderá cancelar um pedido enquanto ele ainda estiver disponível.
            </p>


            <div className="publicar-botoes">

              {onNavigate && (

                <button
                  type="button"
                  onClick={() =>
                    onNavigate('meusPedidos')
                  }
                  className="publicar-button-cancelar"
                >
                  Cancelar
                </button>

              )}


              <button
                type="submit"
                disabled={carregando}
                className="publicar-button-principal"
              >
                {carregando
                  ? 'Publicando...'
                  : 'Publicar pedido'}
              </button>

            </div>

          </div>

        </form>

      </section>

    </div>
  );
}

export default PublicarPedido;