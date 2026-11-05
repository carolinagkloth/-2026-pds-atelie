import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/Perfil.css';

import Portfolio from './Portfolio';
import TabelaPrecos from './TabelaPrecos';


function Perfil({
  usuario,
  onNavigate,
  onUpdateUsuario
}) {

  /* ========================================
     USUÁRIO
  ======================================== */

  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');

      return item && item !== 'undefined'
        ? JSON.parse(item)
        : {};
    } catch {
      return {};
    }
  })();


  const user =
    usuario &&
    Object.keys(usuario).length > 0
      ? usuario
      : usuarioSalvo;


  const idUsuario =
    user?.id_usuario ||
    user?.id;


  const tipoUsuario = (
    user?.tipo_usuario ||
    user?.tipoUsuario ||
    'Cliente'
  )
    .toString()
    .toLowerCase();


  const isCostureira =
    tipoUsuario === 'costureira';


  /* ========================================
     ESTADOS
  ======================================== */

  const [editando, setEditando] =
    useState(false);

  const [carregando, setCarregando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState('');

  const [erro, setErro] =
    useState('');

  const [erroImagem, setErroImagem] =
    useState(false);


  const [reputacao, setReputacao] =
    useState({
      media: 0,
      totalAvaliacoes: 0,
      depoimentos: []
    });


  const [ordensServico, setOrdensServico] =
    useState([]);


  const [dataSelecionada, setDataSelecionada] =
    useState(new Date());


  const [formData, setFormData] =
    useState({
      nome: user?.nome || '',
      email: user?.email || '',
      telefone: user?.telefone || '',
      endereco: user?.endereco || '',
      bio: user?.bio || '',
      especialidades: user?.especialidades || '',
      foto_perfil: user?.foto_perfil || ''
    });


  /* ========================================
     CARREGAR DADOS
  ======================================== */

  useEffect(() => {

    if (!idUsuario) {
      return;
    }


    fetch(`/api/usuarios/${idUsuario}`)
      .then((res) => {

        if (!res.ok) {
          throw new Error(
            'Erro ao carregar dados do usuário'
          );
        }

        return res.json();
      })

      .then((data) => {

        if (!data || data.erro) {
          return;
        }


        setFormData({
          nome: data.nome || '',
          email: data.email || '',
          telefone: data.telefone || '',
          endereco: data.endereco || '',
          bio: data.bio || '',
          especialidades: data.especialidades || '',
          foto_perfil:
            data.foto_perfil ||
            user?.foto_perfil ||
            ''
        });

      })

      .catch(() => {});


    fetch(
      `/api/ordens-servico/usuario/${idUsuario}`
    )

      .then((res) =>
        res.json()
      )

      .then((data) => {

        if (Array.isArray(data)) {
          setOrdensServico(data);
        }

      })

      .catch(() => {});


    if (isCostureira) {

      fetch(
        `/api/avaliacoes/costureira/${idUsuario}`
      )

        .then((res) =>
          res.json()
        )

        .then((data) => {

          if (data && !data.erro) {
            setReputacao(data);
          }

        })

        .catch(() => {});

    }

  }, [idUsuario, isCostureira]);


  /* ========================================
     ALTERAÇÕES
  ======================================== */

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;


    setFormData(
      (prev) => ({
        ...prev,
        [name]: value
      })
    );

  };


  const handleFotoChange = (e) => {

    const file =
      e.target.files[0];


    if (!file) {
      return;
    }


    const reader =
      new FileReader();


    reader.onloadend = () => {

      setErroImagem(false);


      setFormData(
        (prev) => ({
          ...prev,
          foto_perfil:
            reader.result
        })
      );

    };


    reader.readAsDataURL(file);

  };


  const handleIniciarEdicao = () => {

    setMensagem('');

    setErro('');

    setEditando(true);

  };


  const handleCancelar = () => {

    setEditando(false);

    setMensagem('');

    setErro('');

  };


  /* ========================================
     SALVAR PERFIL
  ======================================== */

  const handleSubmit = async (e) => {

    e.preventDefault();

    setMensagem('');

    setErro('');

    setCarregando(true);


    try {

      const response =
        await fetch(
          `/api/usuarios/${idUsuario}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify(
                formData
              )
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.erro ||
          'Erro ao atualizar perfil.'
        );

      }


      const usuarioAtualizado =
        data.usuario ||
        {
          ...user,
          ...formData
        };


      localStorage.setItem(
        'usuarioAtelie',
        JSON.stringify(
          usuarioAtualizado
        )
      );


      if (onUpdateUsuario) {

        onUpdateUsuario(
          usuarioAtualizado
        );

      }


      setMensagem(
        'Perfil atualizado com sucesso!'
      );


      setEditando(false);

    } catch (err) {

      setErro(
        err.message
      );

    } finally {

      setCarregando(false);

    }

  };


  /* ========================================
     VOLTAR
  ======================================== */

  const handleVoltar = () => {

    if (!onNavigate) {
      return;
    }


    onNavigate(
      isCostureira
        ? 'feedPedidos'
        : 'meusPedidos'
    );

  };


  /* ========================================
     AUXILIARES
  ======================================== */

  const primeiraLetra = (
    formData.nome ||
    user?.nome ||
    'U'
  )
    .trim()
    .charAt(0)
    .toUpperCase();


  const renderEstrelas = (nota) => {

    const valor =
      Math.max(
        0,
        Math.min(
          5,
          Math.round(
            Number(nota) || 0
          )
        )
      );


    return (
      '★'.repeat(valor) +
      '☆'.repeat(5 - valor)
    );

  };


  const ordensDaData =
    ordensServico.filter(
      (os) =>
        os.previsaoEntrega &&
        new Date(
          os.previsaoEntrega
        ).toDateString() ===
          dataSelecionada.toDateString()
    );


  /* ========================================
     PERFIL DO CLIENTE
  ======================================== */

  if (!isCostureira) {

    return (

      <div style={paginaClienteStyle}>


        <div style={tituloCabecalhoStyle}>

          <div>

            <span style={eyebrowStyle}>
              Minha conta
            </span>


            <h1 style={tituloPaginaStyle}>
              Meu perfil
            </h1>

          </div>


          <button
            type="button"
            onClick={handleVoltar}
            style={botaoSecundarioStyle}
          >
            ← Voltar
          </button>

        </div>


        {mensagem && (
          <div style={mensagemSucesso}>
            {mensagem}
          </div>
        )}


        {erro && (
          <div style={mensagemErro}>
            {erro}
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          style={perfilCardStyle}
        >

          <div style={perfilClienteTopoStyle}>

            <FotoPerfil
              formData={formData}
              erroImagem={erroImagem}
              setErroImagem={setErroImagem}
              primeiraLetra={primeiraLetra}
              editando={editando}
              handleFotoChange={handleFotoChange}
            />


            <div style={{ flex: 1 }}>

              <span style={tipoUsuarioStyle}>
                Cliente
              </span>


              <h2 style={nomeStyle}>
                {
                  formData.nome ||
                  'Usuário'
                }
              </h2>


              <span style={emailStyle}>
                {formData.email}
              </span>

            </div>


            {!editando && (

              <button
                type="button"
                onClick={handleIniciarEdicao}
                style={botaoPrincipal}
              >
                Editar perfil
              </button>

            )}

          </div>


          <div style={{ padding: '28px' }}>

            <FormularioPerfil
              formData={formData}
              handleChange={handleChange}
              mostrarBio={false}
            />


            {editando && (

              <AcoesEdicao
                carregando={carregando}
                handleCancelar={handleCancelar}
              />

            )}

          </div>

        </form>

      </div>

    );

  }


  /* ========================================
     PERFIL DA COSTUREIRA
  ======================================== */

  return (

    <div style={paginaCostureiraStyle}>


      {/* TÍTULO */}

      <section style={tituloCabecalhoStyle}>

        <div>

          <span style={eyebrowStyle}>
            Perfil profissional
          </span>


          <h1 style={tituloPaginaStyle}>
            Meu perfil
          </h1>


          <p style={subtituloStyle}>
            Sua vitrine profissional dentro do
            Ateliê Entre Linhas.
          </p>

        </div>


        <button
          type="button"
          onClick={handleVoltar}
          style={botaoSecundarioStyle}
        >
          ← Voltar aos pedidos
        </button>

      </section>


      {mensagem && (
        <div style={mensagemSucesso}>
          {mensagem}
        </div>
      )}


      {erro && (
        <div style={mensagemErro}>
          {erro}
        </div>
      )}


      {/* PERFIL PRINCIPAL */}

      <form
        onSubmit={handleSubmit}
        style={perfilCardStyle}
      >

        <div style={perfilCostureiraTopoStyle}>

          <FotoPerfil
            formData={formData}
            erroImagem={erroImagem}
            setErroImagem={setErroImagem}
            primeiraLetra={primeiraLetra}
            editando={editando}
            handleFotoChange={handleFotoChange}
          />


          <div>

            <span style={tipoUsuarioStyle}>
              Costureira
            </span>


            <h2 style={nomeStyle}>
              {
                formData.nome ||
                'Costureira'
              }
            </h2>


            <div style={{ marginBottom: '14px' }}>

              <strong style={labelResumoStyle}>
                Local de atendimento
              </strong>


              <span style={textoResumoStyle}>
                {
                  formData.endereco ||
                  'Local de atendimento não informado.'
                }
              </span>

            </div>


            {formData.especialidades && (

              <p style={especialidadesStyle}>

                <strong>
                  Especialidades:
                </strong>

                {' '}

                {formData.especialidades}

              </p>

            )}


            <p
              style={{
                ...bioStyle,

                color:
                  formData.bio
                    ? '#625962'
                    : '#A0949C'
              }}
            >
              {
                formData.bio ||
                'Adicione uma apresentação para contar aos clientes sobre seu trabalho, experiência e especialidades.'
              }
            </p>


            <div style={avaliacaoResumoStyle}>

              <strong style={notaResumoStyle}>
                ★ {
                  reputacao.media
                    ? Number(
                        reputacao.media
                      ).toFixed(1)
                    : '0.0'
                }
              </strong>


              <span style={avaliacaoTextoStyle}>
                {
                  reputacao.totalAvaliacoes ||
                  0
                } avaliações
              </span>

            </div>

          </div>


          {!editando && (

            <button
              type="button"
              onClick={handleIniciarEdicao}
              style={botaoPrincipal}
            >
              Editar perfil
            </button>

          )}

        </div>


        {editando && (

          <div style={areaEdicaoStyle}>

            <FormularioPerfil
              formData={formData}
              handleChange={handleChange}
              mostrarBio
            />


            <AcoesEdicao
              carregando={carregando}
              handleCancelar={handleCancelar}
            />

          </div>

        )}

      </form>


      {/* AGENDA + AVALIAÇÃO */}

      <section style={gridPrincipalStyle}>


        <div style={cardStyle}>

          <span style={eyebrowStyle}>
            Organização
          </span>


          <h2 style={tituloSecaoStyle}>
            Agenda de entregas e provas
          </h2>


          <div style={agendaStyle}>

            <div style={{ overflowX: 'auto' }}>

              <Calendar
                onChange={setDataSelecionada}
                value={dataSelecionada}
              />

            </div>


            <div>

              <strong style={dataAgendaStyle}>
                {
                  dataSelecionada
                    .toLocaleDateString(
                      'pt-BR'
                    )
                }
              </strong>


              {ordensDaData.length === 0 ? (

                <div style={estadoVazioStyle}>

                  <strong style={estadoVazioTituloStyle}>
                    Nenhum compromisso nesta data
                  </strong>


                  <span style={estadoVazioTextoStyle}>
                    Não há entregas ou provas previstas.
                  </span>

                </div>

              ) : (

                ordensDaData.map(
                  (item) => (

                    <div
                      key={item.id}
                      style={agendaItemStyle}
                    >

                      <strong style={agendaStatusStyle}>
                        {
                          item.statusKanban ||
                          'Ordem de serviço'
                        }
                      </strong>


                      <span style={agendaDescricaoStyle}>
                        {
                          item.pedidoDescricao ||
                          'Serviço sem descrição.'
                        }
                      </span>


                      <small style={agendaClienteStyle}>
                        Cliente: {
                          item.clienteNome ||
                          'Não informado'
                        }
                      </small>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        </div>


        {/* AVALIAÇÃO */}

        <div style={cardStyle}>

          <span style={eyebrowStyle}>
            Reputação
          </span>


          <h2 style={tituloSecaoStyle}>
            Avaliação
          </h2>


          <div style={avaliacaoGrandeStyle}>

            <strong style={notaGrandeStyle}>
              {
                reputacao.media
                  ? Number(
                      reputacao.media
                    ).toFixed(1)
                  : '0.0'
              }
            </strong>


            <div style={estrelasStyle}>
              {
                renderEstrelas(
                  reputacao.media
                )
              }
            </div>


            <span style={avaliacaoTextoStyle}>
              Baseado em {
                reputacao.totalAvaliacoes ||
                0
              } avaliações
            </span>

          </div>

        </div>

      </section>


      {/* DEPOIMENTOS */}

      {reputacao.depoimentos &&
        reputacao.depoimentos.length > 0 && (

        <section
          style={{
            ...cardStyle,
            marginBottom: '25px'
          }}
        >

          <span style={eyebrowStyle}>
            Experiências
          </span>


          <h2 style={tituloSecaoStyle}>
            Depoimentos dos clientes
          </h2>


          <div style={{ marginTop: '18px' }}>

            {reputacao.depoimentos.map(
              (dep) => (

                <div
                  key={dep.id}
                  style={depoimentoStyle}
                >

                  <div style={depoimentoTopoStyle}>

                    <strong style={depoimentoNomeStyle}>
                      {
                        dep.clienteNome ||
                        'Cliente'
                      }
                    </strong>


                    <span style={depoimentoEstrelasStyle}>
                      {
                        renderEstrelas(
                          dep.nota
                        )
                      }
                    </span>

                  </div>


                  {dep.comentario && (

                    <p style={depoimentoTextoStyle}>
                      “{dep.comentario}”
                    </p>

                  )}


                  {dep.data && (

                    <span style={depoimentoDataStyle}>
                      {
                        new Date(
                          dep.data
                        ).toLocaleDateString(
                          'pt-BR'
                        )
                      }
                    </span>

                  )}

                </div>

              )
            )}

          </div>

        </section>

      )}


      {/* TABELA REAL DA CAROLINA */}

      <TabelaPrecos
        modoEdicao={editando}
      />


      {/* PORTFÓLIO REAL DA CAROLINA */}

      <Portfolio
        idCostureira={idUsuario}
        modoEdicao={editando}
      />

    </div>

  );

}


/* ========================================
   FOTO
======================================== */

function FotoPerfil({
  formData,
  erroImagem,
  setErroImagem,
  primeiraLetra,
  editando,
  handleFotoChange
}) {

  return (

    <div style={fotoContainerStyle}>

      <div style={fotoStyle}>

        {
          formData.foto_perfil &&
          !erroImagem
            ? (

              <img
                src={formData.foto_perfil}
                alt="Foto de perfil"
                referrerPolicy="no-referrer"
                onError={() =>
                  setErroImagem(true)
                }
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

            )
            : (

              <span style={fotoLetraStyle}>
                {primeiraLetra}
              </span>

            )
        }

      </div>


      {editando && (

        <>

          <label
            htmlFor="perfil-foto-upload"
            style={botaoFotoStyle}
          >
            +
          </label>


          <input
            id="perfil-foto-upload"
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            style={{
              display: 'none'
            }}
          />

        </>

      )}

    </div>

  );

}


/* ========================================
   FORMULÁRIO
======================================== */

function FormularioPerfil({
  formData,
  handleChange,
  mostrarBio
}) {

  return (

    <div style={formGridStyle}>

      <Campo
        label="Nome"
        name="nome"
        value={formData.nome}
        onChange={handleChange}
        required
      />


      <Campo
        label="E-mail"
        value={formData.email}
        disabled
      />


      <Campo
        label="Telefone / WhatsApp"
        name="telefone"
        value={formData.telefone}
        onChange={handleChange}
        placeholder="(42) 99999-9999"
      />


      <Campo
        label={
          mostrarBio
            ? 'Local de atendimento'
            : 'Endereço / Cidade'
        }
        name="endereco"
        value={formData.endereco}
        onChange={handleChange}
        placeholder="Ex.: Centro - Ponta Grossa / PR"
      />


      {mostrarBio && (

        <>

          <div style={{ gridColumn: '1 / -1' }}>

            <label style={labelStyle}>
              Especialidades / Serviços
            </label>


            <input
              type="text"
              name="especialidades"
              value={formData.especialidades}
              onChange={handleChange}
              placeholder="Ex.: Vestidos de festa, ajustes, barras..."
              style={inputStyle}
            />

          </div>


          <div style={{ gridColumn: '1 / -1' }}>

            <label style={labelStyle}>
              Sobre mim
            </label>


            <textarea
              name="bio"
              rows="5"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Conte sobre sua experiência, serviços e especialidades..."
              style={{
                ...inputStyle,
                minHeight: '120px',
                resize: 'vertical',
                lineHeight: '1.6'
              }}
            />

          </div>

        </>

      )}

    </div>

  );

}


/* ========================================
   CAMPO
======================================== */

function Campo({
  label,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false
}) {

  return (

    <div>

      <label style={labelStyle}>
        {label}
      </label>


      <input
        type={
          label === 'E-mail'
            ? 'email'
            : 'text'
        }
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        style={{
          ...inputStyle,

          background:
            disabled
              ? '#F3F0F1'
              : '#FFFFFF',

          color:
            disabled
              ? '#8E858B'
              : '#4A424A'
        }}
      />

    </div>

  );

}


/* ========================================
   AÇÕES
======================================== */

function AcoesEdicao({
  carregando,
  handleCancelar
}) {

  return (

    <div style={acoesStyle}>

      <button
        type="button"
        onClick={handleCancelar}
        style={botaoSecundarioStyle}
      >
        Cancelar
      </button>


      <button
        type="submit"
        disabled={carregando}
        style={{
          ...botaoPrincipal,

          opacity:
            carregando
              ? 0.65
              : 1
        }}
      >
        {
          carregando
            ? 'Salvando...'
            : 'Salvar alterações'
        }
      </button>

    </div>

  );

}


/* ========================================
   ESTILOS
======================================== */

const paginaClienteStyle = {
  width: 'min(900px, 92%)',
  margin: '38px auto 70px',
  fontFamily:
    "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  color: '#4A424A'
};


const paginaCostureiraStyle = {
  width: 'min(1120px, 94%)',
  margin: '38px auto 70px',
  fontFamily:
    "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  color: '#4A424A'
};


const tituloCabecalhoStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '25px',
  marginBottom: '25px',
  flexWrap: 'wrap'
};


const eyebrowStyle = {
  display: 'block',
  marginBottom: '6px',
  color: '#917687',
  fontSize: '10px',
  fontWeight: '700',
  letterSpacing: '1.4px',
  textTransform: 'uppercase'
};


const tituloPaginaStyle = {
  margin: 0,
  color: '#3E2445',
  fontFamily:
    "'Playfair Display', Georgia, serif",
  fontSize: '34px',
  lineHeight: '1.15'
};


const subtituloStyle = {
  margin: '8px 0 0',
  color: '#857885',
  fontSize: '13px'
};


const perfilCardStyle = {
  marginBottom: '22px',
  overflow: 'hidden',
  background: '#FFFFFF',
  border: '1px solid #EBE5E0',
  borderRadius: '15px',
  boxShadow:
    '0 10px 28px rgba(62,36,69,0.06)'
};


const perfilClienteTopoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  padding: '28px',
  background: '#FAF8F7',
  flexWrap: 'wrap'
};


const perfilCostureiraTopoStyle = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr) auto',
  gap: '25px',
  alignItems: 'start',
  padding: '30px'
};


const tipoUsuarioStyle = {
  display: 'inline-block',
  marginBottom: '7px',
  padding: '4px 9px',
  background: '#F3ECEF',
  color: '#7A5B72',
  borderRadius: '999px',
  fontSize: '8px',
  fontWeight: '700',
  letterSpacing: '0.7px',
  textTransform: 'uppercase'
};


const nomeStyle = {
  margin: '0 0 14px',
  color: '#3E2445',
  fontFamily:
    "'Playfair Display', Georgia, serif",
  fontSize: '26px'
};


const emailStyle = {
  color: '#91858E',
  fontSize: '11px'
};


const fotoContainerStyle = {
  position: 'relative',
  flexShrink: 0
};


const fotoStyle = {
  width: '105px',
  height: '105px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  background: '#7A5B72',
  border: '4px solid #FFFFFF',
  borderRadius: '50%',
  boxShadow:
    '0 5px 18px rgba(62,36,69,0.14)'
};


const fotoLetraStyle = {
  color: '#FFFFFF',
  fontFamily:
    "'Playfair Display', Georgia, serif",
  fontSize: '40px',
  fontWeight: '700'
};


const botaoFotoStyle = {
  position: 'absolute',
  right: 0,
  bottom: '2px',
  width: '31px',
  height: '31px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#FFFFFF',
  color: '#7A5B72',
  border: '1px solid #D8CFD5',
  borderRadius: '50%',
  fontSize: '17px',
  fontWeight: '700',
  cursor: 'pointer'
};


const labelResumoStyle = {
  display: 'block',
  marginBottom: '4px',
  color: '#625762',
  fontSize: '10px'
};


const textoResumoStyle = {
  color: '#857885',
  fontSize: '11px',
  lineHeight: '1.6'
};


const especialidadesStyle = {
  margin: '0 0 12px',
  color: '#625962',
  fontSize: '11px',
  lineHeight: '1.6'
};


const bioStyle = {
  maxWidth: '650px',
  margin: 0,
  fontSize: '12px',
  lineHeight: '1.7'
};


const avaliacaoResumoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  marginTop: '16px'
};


const notaResumoStyle = {
  color: '#7A5B72',
  fontSize: '12px'
};


const avaliacaoTextoStyle = {
  color: '#9A8E96',
  fontSize: '10px'
};


const areaEdicaoStyle = {
  padding: '25px 30px',
  background: '#FAF8F7',
  borderTop: '1px solid #EEE7E3'
};


const formGridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(230px, 1fr))',
  gap: '18px'
};


const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  color: '#5F525C',
  fontSize: '10px',
  fontWeight: '700'
};


const inputStyle = {
  width: '100%',
  padding: '11px 12px',
  boxSizing: 'border-box',
  background: '#FFFFFF',
  color: '#4A424A',
  border: '1px solid #DED6D1',
  borderRadius: '8px',
  fontFamily:
    "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  fontSize: '12px',
  outline: 'none'
};


const acoesStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '9px',
  marginTop: '24px',
  paddingTop: '20px',
  borderTop: '1px solid #EEE7E3'
};


const botaoPrincipal = {
  padding: '10px 16px',
  background: '#7A5B72',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontSize: '10px',
  fontWeight: '700',
  cursor: 'pointer'
};


const botaoSecundarioStyle = {
  padding: '9px 15px',
  background: '#FFFFFF',
  color: '#7A5B72',
  border: '1px solid #D8CFD5',
  borderRadius: '8px',
  fontSize: '10px',
  fontWeight: '700',
  cursor: 'pointer'
};


const gridPrincipalStyle = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1.65fr) minmax(250px, 0.75fr)',
  gap: '18px',
  marginBottom: '25px'
};


const cardStyle = {
  padding: '22px',
  background: '#FFFFFF',
  border: '1px solid #EBE5E0',
  borderRadius: '13px',
  boxShadow:
    '0 7px 20px rgba(62,36,69,0.05)'
};


const tituloSecaoStyle = {
  margin: 0,
  color: '#3E2445',
  fontFamily:
    "'Playfair Display', Georgia, serif",
  fontSize: '19px'
};


const agendaStyle = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(270px, 0.9fr) minmax(220px, 1fr)',
  gap: '20px',
  marginTop: '18px'
};


const dataAgendaStyle = {
  display: 'block',
  marginBottom: '12px',
  color: '#6D5D68',
  fontSize: '11px'
};


const estadoVazioStyle = {
  padding: '20px',
  background: '#FAF8F7',
  border: '1px dashed #D9CCD5',
  borderRadius: '9px'
};


const estadoVazioTituloStyle = {
  display: 'block',
  marginBottom: '5px',
  color: '#6E5E68',
  fontSize: '11px'
};


const estadoVazioTextoStyle = {
  color: '#9A8E96',
  fontSize: '10px'
};


const agendaItemStyle = {
  marginBottom: '9px',
  padding: '12px 14px',
  background: '#FAF8F7',
  border: '1px solid #EEE7E3',
  borderLeft: '3px solid #A7839B',
  borderRadius: '8px'
};


const agendaStatusStyle = {
  display: 'block',
  marginBottom: '4px',
  color: '#5E4557',
  fontSize: '10px'
};


const agendaDescricaoStyle = {
  display: 'block',
  color: '#6F646B',
  fontSize: '10px',
  lineHeight: '1.5'
};


const agendaClienteStyle = {
  display: 'block',
  marginTop: '4px',
  color: '#9A8E96',
  fontSize: '9px'
};


const avaliacaoGrandeStyle = {
  marginTop: '22px',
  textAlign: 'center'
};


const notaGrandeStyle = {
  display: 'block',
  color: '#3E2445',
  fontFamily:
    "'Playfair Display', Georgia, serif",
  fontSize: '38px'
};


const estrelasStyle = {
  margin: '5px 0',
  color: '#BB91AD',
  letterSpacing: '2px',
  fontSize: '16px'
};


const depoimentoStyle = {
  padding: '12px 0',
  borderBottom:
    '1px solid #F0EAE7'
};


const depoimentoTopoStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};


const depoimentoNomeStyle = {
  color: '#5E4557',
  fontSize: '11px'
};


const depoimentoEstrelasStyle = {
  color: '#BB91AD',
  fontSize: '12px'
};


const depoimentoTextoStyle = {
  margin: '6px 0',
  color: '#6F646B',
  fontSize: '11px',
  lineHeight: '1.6'
};


const depoimentoDataStyle = {
  color: '#A0949C',
  fontSize: '9px'
};


const mensagemSucesso = {
  marginBottom: '16px',
  padding: '11px 14px',
  background: '#EEF6EC',
  color: '#5C7657',
  border: '1px solid #D9E8D5',
  borderRadius: '8px',
  fontSize: '11px'
};


const mensagemErro = {
  marginBottom: '16px',
  padding: '11px 14px',
  background: '#FFF1F1',
  color: '#A43B3B',
  border: '1px solid #F1D5D5',
  borderRadius: '8px',
  fontSize: '11px'
};


export default Perfil;