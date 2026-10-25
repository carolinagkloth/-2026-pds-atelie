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

      const response = await fetch(
        'http://localhost:3000/api/pedidos',
        {
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
        }
      );

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
        onNavigate('pedidos');
      }
    } catch (err) {
      setErro(err.message);
      alert(`Erro: ${err.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="publicar-card">

      <h2>Publicar Novo Pedido</h2>

      <p className="publicar-subtitle">
        Descreva o serviço de costura ou ajuste que você precisa
        para que as costureiras da região possam visualizar.
      </p>

      {erro && (
        <div className="publicar-erro">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div className="publicar-form-group">
          <label>Tipo de Serviço *</label>

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
          <label>Descrição Detalhada *</label>

          <textarea
            rows="4"
            value={descricao}
            onChange={(e) =>
              setDescricao(e.target.value)
            }
            placeholder="Ex: Preciso fazer a barra de uma calça jeans e apertar 2cm na cintura de um vestido..."
            required
          />
        </div>

        <div className="publicar-duas-colunas">

          <div className="publicar-form-group">
            <label>Prazo Desejado *</label>

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
            <label>Bairro / Localização *</label>

            <input
              type="text"
              value={localizacao}
              onChange={(e) =>
                setLocalizacao(e.target.value)
              }
              placeholder="Ex: Centro - Ponta Grossa"
              required
            />
          </div>

        </div>

        <div className="publicar-form-group publicar-upload">
          <label>
            Foto de Referência da Peça
            (Opcional - PNG ou JPG)
          </label>

          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileChange}
          />

          {previewFoto && (
            <div className="publicar-preview">
              <p>Pré-visualização:</p>

              <img
                src={previewFoto}
                alt="Pré-visualização"
              />
            </div>
          )}
        </div>

        <div className="publicar-botoes">

          <button
            type="submit"
            disabled={carregando}
            className="publicar-button-principal"
          >
            {carregando
              ? 'Publicando...'
              : 'Publicar no Mural de Pedidos'}
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('pedidos')}
              className="publicar-button-cancelar"
            >
              Cancelar
            </button>
          )}

        </div>

      </form>
    </div>
  );
}

export default PublicarPedido;