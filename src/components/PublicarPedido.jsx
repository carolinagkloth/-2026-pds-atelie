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


  const user =
    usuario ||
    usuarioLogado ||
    sessaoSalva;


  const [tiposervico, setTiposervico] =
    useState('Ajuste / Conserto');

  const [descricao, setDescricao] =
    useState('');

  const [prazoDesejado, setPrazoDesejado] =
    useState('');

  const [
    horarioPreferencial,
    setHorarioPreferencial
  ] = useState('14:00');

  const [
    semPreferenciaHorario,
    setSemPreferenciaHorario
  ] = useState(true);

  const [localizacao, setLocalizacao] =
    useState('');

  const [previewFoto, setPreviewFoto] =
    useState('');

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] =
    useState('');


  const hoje =
    new Date()
      .toISOString()
      .split('T')[0];


  /* ========================================
     FOTO
  ======================================== */

  const handleFileChange = (e) => {

    const file =
      e.target.files[0];


    if (file) {

      const reader =
        new FileReader();


      reader.onloadend = () => {

        setPreviewFoto(
          reader.result
        );

      };


      reader.readAsDataURL(
        file
      );

    }

  };


  /* ========================================
     PUBLICAÇÃO
     LÓGICA ATUAL DA CAROLINA
  ======================================== */

  const handleSubmit = async (e) => {

    e.preventDefault();

    setErro('');


    if (
      !descricao ||
      !prazoDesejado ||
      !localizacao
    ) {

      alert(
        'Por favor, preencha todos os campos obrigatórios!'
      );

      return;

    }


    const idCliente =
      user?.id_usuario ||
      user?.id;


    if (!idCliente) {

      alert(
        'Sessão expirada ou usuário não identificado. Faça login novamente.'
      );

      return;

    }


    setCarregando(true);


    try {

      const descricaoFormatada =
        `[${tiposervico}] - Localização: ${localizacao}\n\n${descricao.trim()}`;


      const horarioTexto =
        semPreferenciaHorario
          ? 'Horário a combinar'
          : (
              horarioPreferencial ||
              'Horário a definir'
            );


      const prazoFormatadoComHorario =
        `${prazoDesejado} (${horarioTexto})`;


      const response =
        await fetch(
          '/api/pedidos',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                id_cliente:
                  idCliente,

                descricao:
                  descricaoFormatada,

                fotos_referencia:
                  previewFoto ||
                  null,

                prazo_desejado:
                  prazoFormatadoComHorario
              })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.erro ||
          'Erro ao publicar o pedido.'
        );

      }


      const novoPedido =
        data.pedido ||
        {
          id:
            Date.now(),

          clienteId:
            idCliente,

          clienteNome:
            user?.nome ||
            'Cliente',

          tiposervico,

          descricao:
            descricaoFormatada,

          prazoDesejado:
            prazoFormatadoComHorario,

          localizacao,

          fotoReferencia:
            previewFoto ||
            null,

          status:
            'Aberto',

          dataPublicacao:
            new Date()
              .toLocaleDateString()
        };


      if (onPublicarSucesso) {

        onPublicarSucesso(
          novoPedido
        );

      }


      alert(
        'Pedido publicado com sucesso!'
      );


      if (onNavigate) {

        onNavigate(
          'meusPedidos'
        );

      }

    } catch (err) {

      setErro(
        err.message
      );


      alert(
        `Erro: ${err.message}`
      );

    } finally {

      setCarregando(false);

    }

  };


  return (

    <div className="publicar-page">


      {/* CABEÇALHO */}

      <section className="publicar-cabecalho">

        <div>

          <span className="publicar-etiqueta">
            Área do cliente
          </span>


          <h1>
            Publicar novo pedido
          </h1>


          <p>
            Conte o que você precisa e informe
            os detalhes para que as costureiras
            possam avaliar sua solicitação.
          </p>

        </div>


        {onNavigate && (

          <button
            type="button"

            className="publicar-voltar"

            onClick={() =>
              onNavigate(
                'meusPedidos'
              )
            }
          >
            ← Meus pedidos
          </button>

        )}

      </section>


      {/* CARD */}

      <section className="publicar-card">


        <div className="publicar-card-topo">

          <span className="publicar-card-etiqueta">
            Solicitação de serviço
          </span>


          <h2>
            Detalhes do pedido
          </h2>


          <p className="publicar-subtitle">
            Preencha as informações abaixo.
            Os campos com * são obrigatórios.
          </p>

        </div>


        {erro && (

          <div className="publicar-erro">
            {erro}
          </div>

        )}


        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* TIPO */}

          <div className="publicar-form-group">

            <label>
              Tipo de serviço *
            </label>


            <select
              value={
                tiposervico
              }

              onChange={(e) =>
                setTiposervico(
                  e.target.value
                )
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


          {/* DESCRIÇÃO */}

          <div className="publicar-form-group">

            <label>
              Descrição detalhada *
            </label>


            <textarea
              rows="5"

              value={
                descricao
              }

              onChange={(e) =>
                setDescricao(
                  e.target.value
                )
              }

              placeholder="Ex.: Preciso fazer a barra de uma calça jeans e apertar 2 cm na cintura de um vestido..."

              required
            />

          </div>


          {/* PRAZO + LOCAL */}

          <div className="publicar-duas-colunas">


            <div className="publicar-form-group">

              <label>
                Prazo desejado *
              </label>


              <input
                type="date"

                min={
                  hoje
                }

                value={
                  prazoDesejado
                }

                onChange={(e) =>
                  setPrazoDesejado(
                    e.target.value
                  )
                }

                required
              />

            </div>


            <div className="publicar-form-group">

              <label>
                Bairro / Localização *
              </label>


              <input
                type="text"

                value={
                  localizacao
                }

                onChange={(e) =>
                  setLocalizacao(
                    e.target.value
                  )
                }

                placeholder="Ex.: Centro - Ponta Grossa"

                required
              />

            </div>


          </div>


          {/* HORÁRIO */}

          <div className="publicar-horario-box">

            <div className="publicar-horario-titulo">

              <span>
                Preferência de horário
              </span>

              <small>
                Opcional
              </small>

            </div>


            <div className="publicar-duas-colunas">


              <div className="publicar-form-group publicar-horario">

                <label>
                  Horário preferencial
                </label>


                <input
                  type="time"

                  value={
                    horarioPreferencial
                  }

                  disabled={
                    semPreferenciaHorario
                  }

                  onChange={(e) =>
                    setHorarioPreferencial(
                      e.target.value
                    )
                  }
                />

              </div>


              <div className="publicar-checkbox-area">

                <label>

                  <input
                    type="checkbox"

                    checked={
                      semPreferenciaHorario
                    }

                    onChange={(e) =>
                      setSemPreferenciaHorario(
                        e.target.checked
                      )
                    }
                  />


                  <span>
                    Sem preferência / Horário a combinar
                  </span>

                </label>

              </div>


            </div>

          </div>


          {/* FOTO */}

          <div className="publicar-form-group publicar-upload">

            <label>
              Foto de referência da peça
            </label>


            <span className="publicar-upload-ajuda">
              Opcional — PNG ou JPG
            </span>


            <label className="publicar-upload-box">

              <span className="publicar-upload-icone">
                +
              </span>


              <strong>
                Selecionar imagem
              </strong>


              <span>
                Escolha uma foto para ajudar
                a costureira a entender o serviço
              </span>


              <input
                type="file"

                accept="image/png, image/jpeg, image/jpg"

                onChange={
                  handleFileChange
                }
              />

            </label>


            {previewFoto && (

              <div className="publicar-preview">

                <span>
                  Pré-visualização
                </span>


                <img
                  src={
                    previewFoto
                  }

                  alt="Pré-visualização"
                />

              </div>

            )}

          </div>


          {/* AÇÕES */}

          <div className="publicar-botoes">


            {onNavigate && (

              <button
                type="button"

                onClick={() =>
                  onNavigate(
                    'meusPedidos'
                  )
                }

                className="publicar-button-cancelar"
              >
                Cancelar
              </button>

            )}


            <button
              type="submit"

              disabled={
                carregando
              }

              className="publicar-button-principal"
            >
              {carregando
                ? 'Publicando...'
                : 'Publicar no mural de pedidos'
              }
            </button>


          </div>


        </form>

      </section>

    </div>

  );

}


export default PublicarPedido;