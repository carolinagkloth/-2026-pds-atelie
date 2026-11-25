import React, { useState, useEffect } from 'react';
import "../styles/Perfil.css";
import Portfolio from './Portfolio';
import TabelaPrecos from './TabelaPrecos';
import Agenda from './Agenda';


function Perfil({
  usuario,
  onNavigate,
  onUpdateUsuario
}) {

  const usuarioSalvo = (() => {
    try {
      const item =
        localStorage.getItem(
          'usuarioAtelie'
        );

      return item &&
        item !== 'undefined'
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


  const isCliente =
    (
      user?.tipo_usuario ||
      user?.tipoUsuario ||
      'Cliente'
    )
      .toString()
      .toLowerCase() === 'cliente';


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


  const [formData, setFormData] =
    useState({
      nome: user?.nome || '',
      email: user?.email || '',
      telefone: user?.telefone || '',
      endereco: user?.endereco || '',
      bio: user?.bio || '',
      especialidades:
        user?.especialidades || '',
      foto_perfil:
        user?.foto_perfil || ''
    });


  /* ========================================
     LÓGICA ORIGINAL DA CAROLINA
  ======================================== */

  useEffect(() => {

    if (idUsuario) {

      fetch(
        `/api/usuarios/${idUsuario}`
      )

        .then((res) =>
          res.json()
        )

        .then((data) => {

          if (
            data &&
            !data.erro
          ) {

            setFormData({
              nome:
                data.nome || '',

              email:
                data.email || '',

              telefone:
                data.telefone || '',

              endereco:
                data.endereco || '',

              bio:
                data.bio || '',

              especialidades:
                data.especialidades || '',

              foto_perfil:
                data.foto_perfil || ''
            });

          }

        })

        .catch(() => {});


      if (!isCliente) {

        fetch(
          `/api/avaliacoes/costureira/${idUsuario}`
        )

          .then((res) =>
            res.json()
          )

          .then((data) => {

            if (
              data &&
              !data.erro
            ) {

              setReputacao({
                media:
                  data.media ||
                  data.media_nota ||
                  0,

                totalAvaliacoes:
                  data.totalAvaliacoes ||
                  data.total_avaliacoes ||
                  0,

                depoimentos:
                  data.depoimentos ||
                  data.avaliacoes ||
                  []
              });

            }

          })

          .catch(() => {});

      }

    }

  }, [idUsuario, isCliente]);


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


    if (file) {

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


      reader.readAsDataURL(
        file
      );

    }

  };


  const handleRemoverFoto = () => {

    setErroImagem(false);


    setFormData(
      (prev) => ({
        ...prev,
        foto_perfil: ''
      })
    );

  };


  const handleIniciarEdicao = (e) => {

    e.preventDefault();
    e.stopPropagation();

    setMensagem('');
    setErro('');
    setEditando(true);

  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    setMensagem('');
    setErro('');


    if (
      !isCliente &&
      !formData.endereco.trim()
    ) {

      setErro(
        'O endereço de atendimento é obrigatório para costureiras.'
      );

      return;

    }


    setCarregando(true);


    try {

      const payload = {
        ...formData,

        endereco:
          formData.endereco.trim()
      };


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
                payload
              )
          }
        );


      const textResponse =
        await response.text();


      let data;


      try {

        data =
          JSON.parse(
            textResponse
          );

      } catch {

        throw new Error(
          'Servidor retornou uma resposta inválida.'
        );

      }


      if (!response.ok) {

        throw new Error(
          data.erro ||
          data.error ||
          'Erro ao atualizar perfil.'
        );

      }


      const usuarioAtualizado =
        data.usuario ||
        {
          ...user,
          ...payload
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


  const primeiraLetra =
    (
      formData.nome ||
      user?.nome ||
      'U'
    )
      .trim()
      .charAt(0)
      .toUpperCase();


  /* ========================================
     VOLTAR
     CLIENTE -> ÁREA DO CLIENTE
     COSTUREIRA -> MURAL
  ======================================== */

  const handleVoltar = () => {

    if (onNavigate) {

      onNavigate(
        isCliente
          ? 'areaCliente'
          : 'feedPedidos'
      );

    }

  };


  const handleLogout = () => {

    localStorage.removeItem(
      'usuarioAtelie'
    );


    if (onNavigate) {

      onNavigate(
        'inicio'
      );

    }

  };


  const renderEstrelas = (nota) => {

    const valor =
      Math.round(
        nota || 0
      );


    return (
      '★'.repeat(valor) +
      '☆'.repeat(5 - valor)
    );

  };


  /* ========================================
     VISUAL
  ======================================== */

  return (

    <div
      style={{
        width:
          isCliente
            ? 'min(900px, 92%)'
            : 'min(1120px, 94%)',

        margin:
          '38px auto 70px',

        fontFamily:
          "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

        color:
          '#4A424A'
      }}
    >


      {/* CABEÇALHO */}

      <section
        style={{
          display:
            'flex',

          justifyContent:
            'space-between',

          alignItems:
            'flex-end',

          gap:
            '24px',

          marginBottom:
            '25px',

          flexWrap:
            'wrap'
        }}
      >


        <div>

          <span
            style={{
              display:
                'block',

              marginBottom:
                '6px',

              color:
                '#917687',

              fontSize:
                '10px',

              fontWeight:
                '700',

              letterSpacing:
                '1.4px',

              textTransform:
                'uppercase'
            }}
          >
            {isCliente
              ? 'Minha conta'
              : 'Área profissional'}
          </span>


          <h1
            style={{
              margin:
                0,

              color:
                '#3E2445',

              fontFamily:
                "'Playfair Display', Georgia, serif",

              fontSize:
                '34px',

              lineHeight:
                '1.15'
            }}
          >
            {isCliente
              ? 'Meu Perfil'
              : 'Perfil Profissional'}
          </h1>


          <p
            style={{
              maxWidth:
                '650px',

              margin:
                '8px 0 0',

              color:
                '#857885',

              fontSize:
                '13px',

              lineHeight:
                '1.6'
            }}
          >
            {isCliente
              ? 'Mantenha seus dados pessoais atualizados.'
              : 'Apresente seu trabalho, seus serviços e as informações do seu ateliê.'}
          </p>

        </div>


        <button
          type="button"

          onClick={
            handleVoltar
          }

          style={{
            height:
              '40px',

            padding:
              '0 15px',

            background:
              '#FFFFFF',

            color:
              '#7A5B72',

            border:
              '1px solid #D8CFD5',

            borderRadius:
              '8px',

            fontSize:
              '10px',

            fontWeight:
              '700',

            cursor:
              'pointer'
          }}
        >
          ← Voltar
        </button>

      </section>


      {/* MENSAGENS */}

      {mensagem && (

        <div
          style={{
            marginBottom:
              '16px',

            padding:
              '11px 14px',

            background:
              '#EEF6EC',

            color:
              '#5C7657',

            border:
              '1px solid #D9E8D5',

            borderRadius:
              '8px',

            fontSize:
              '11px'
          }}
        >
          {mensagem}
        </div>

      )}


      {erro && (

        <div
          style={{
            marginBottom:
              '16px',

            padding:
              '11px 14px',

            background:
              '#FFF1F1',

            color:
              '#A43B3B',

            border:
              '1px solid #F1D5D5',

            borderRadius:
              '8px',

            fontSize:
              '11px'
          }}
        >
          {erro}
        </div>

      )}


      {/* CARD PRINCIPAL */}

      <form
        onSubmit={
          handleSubmit
        }

        style={{
          marginBottom:
            '24px',

          overflow:
            'hidden',

          background:
            '#FFFFFF',

          border:
            '1px solid #EBE5E0',

          borderRadius:
            '15px',

          boxShadow:
            '0 10px 28px rgba(62,36,69,0.06)'
        }}
      >


        {/* RESUMO DO PERFIL */}

        <div
          style={{
            display:
              'grid',

            gridTemplateColumns:
              'auto minmax(0,1fr) auto',

            alignItems:
              'center',

            gap:
              '24px',

            padding:
              '28px',

            background:
              '#FAF8F7'
          }}
        >


          {/* FOTO */}

          <div
            style={{
              position:
                'relative'
            }}
          >

            <div
              style={{
                width:
                  '105px',

                height:
                  '105px',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                overflow:
                  'hidden',

                background:
                  '#7A5B72',

                border:
                  '4px solid #FFFFFF',

                borderRadius:
                  '50%',

                boxShadow:
                  '0 5px 18px rgba(62,36,69,0.14)'
              }}
            >

              {formData.foto_perfil &&
               !erroImagem ? (

                <img
                  src={
                    formData.foto_perfil
                  }

                  alt="Foto de perfil"

                  referrerPolicy="no-referrer"

                  onError={() =>
                    setErroImagem(
                      true
                    )
                  }

                  style={{
                    width:
                      '100%',

                    height:
                      '100%',

                    objectFit:
                      'cover'
                  }}
                />

              ) : (

                <span
                  style={{
                    color:
                      '#FFFFFF',

                    fontFamily:
                      "'Playfair Display', Georgia, serif",

                    fontSize:
                      '40px',

                    fontWeight:
                      '700',

                    userSelect:
                      'none'
                  }}
                >
                  {primeiraLetra}
                </span>

              )}

            </div>


            {editando && (

              <label
                htmlFor="foto-upload"

                title="Alterar foto"

                style={{
                  position:
                    'absolute',

                  right:
                    0,

                  bottom:
                    '2px',

                  width:
                    '31px',

                  height:
                    '31px',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  background:
                    '#FFFFFF',

                  color:
                    '#7A5B72',

                  border:
                    '1px solid #D8CFD5',

                  borderRadius:
                    '50%',

                  fontSize:
                    '17px',

                  fontWeight:
                    '700',

                  cursor:
                    'pointer'
                }}
              >
                +
              </label>

            )}


            <input
              id="foto-upload"

              type="file"

              accept="image/*"

              onChange={
                handleFotoChange
              }

              style={{
                display:
                  'none'
              }}
            />

          </div>


          {/* DADOS RESUMIDOS */}

          <div>

            <span
              style={{
                display:
                  'inline-block',

                marginBottom:
                  '7px',

                padding:
                  '4px 9px',

                background:
                  '#F3ECEF',

                color:
                  '#7A5B72',

                borderRadius:
                  '999px',

                fontSize:
                  '8px',

                fontWeight:
                  '700',

                letterSpacing:
                  '0.7px',

                textTransform:
                  'uppercase'
              }}
            >
              {isCliente
                ? 'Cliente'
                : 'Costureira'}
            </span>


            <h2
              style={{
                margin:
                  '0 0 6px',

                color:
                  '#3E2445',

                fontFamily:
                  "'Playfair Display', Georgia, serif",

                fontSize:
                  '26px'
              }}
            >
              {formData.nome ||
               'Usuário'}
            </h2>


            <span
              style={{
                display:
                  'block',

                marginBottom:
                  '10px',

                color:
                  '#91858E',

                fontSize:
                  '11px'
              }}
            >
              {formData.email}
            </span>


            {!isCliente &&
             formData.especialidades && (

              <p
                style={{
                  margin:
                    '0 0 7px',

                  color:
                    '#625962',

                  fontSize:
                    '11px',

                  lineHeight:
                    '1.6'
                }}
              >
                <strong>
                  Especialidades:
                </strong>{' '}

                {
                  formData.especialidades
                }
              </p>

            )}


            {!isCliente &&
             formData.bio && (

              <p
                style={{
                  maxWidth:
                    '620px',

                  margin:
                    0,

                  color:
                    '#625962',

                  fontSize:
                    '11px',

                  lineHeight:
                    '1.6'
                }}
              >
                {formData.bio}
              </p>

            )}


            {!isCliente && (

              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    '8px',

                  marginTop:
                    '12px'
                }}
              >

                <strong
                  style={{
                    color:
                      '#7A5B72',

                    fontSize:
                      '11px'
                  }}
                >
                  ★ {
                    reputacao.media
                      ? Number(
                          reputacao.media
                        ).toFixed(1)
                      : '0.0'
                  }
                </strong>


                <span
                  style={{
                    color:
                      '#9A8E96',

                    fontSize:
                      '10px'
                  }}
                >
                  {
                    reputacao.totalAvaliacoes ||
                    0
                  } avaliações
                </span>

              </div>

            )}

          </div>


          {/* AÇÃO */}

          {!editando && (

            <button
              type="button"

              onClick={
                handleIniciarEdicao
              }

              style={{
                padding:
                  '10px 16px',

                background:
                  '#7A5B72',

                color:
                  '#FFFFFF',

                border:
                  'none',

                borderRadius:
                  '8px',

                fontSize:
                  '10px',

                fontWeight:
                  '700',

                cursor:
                  'pointer'
              }}
            >
              Editar perfil
            </button>

          )}

        </div>


        {/* FORMULÁRIO */}

        <div
          style={{
            padding:
              '25px 28px',

            borderTop:
              '1px solid #EEE7E3'
          }}
        >

          <div
            style={{
              display:
                'grid',

              gridTemplateColumns:
                'repeat(auto-fit, minmax(230px, 1fr))',

              gap:
                '18px'
            }}
          >


            <Campo
              label="Nome"

              type="text"

              name="nome"

              value={
                formData.nome
              }

              onChange={
                handleChange
              }

              disabled={
                !editando
              }

              required
            />


            <Campo
              label="E-mail"

              type="email"

              value={
                formData.email
              }

              disabled
            />


            <Campo
              label="Telefone / WhatsApp"

              type="text"

              name="telefone"

              value={
                formData.telefone
              }

              onChange={
                handleChange
              }

              disabled={
                !editando
              }

              placeholder="(42) 99999-9999"
            />


            {!isCliente && (

              <Campo
                label="Especialidades / Serviços"

                type="text"

                name="especialidades"

                value={
                  formData.especialidades
                }

                onChange={
                  handleChange
                }

                disabled={
                  !editando
                }

                placeholder="Ex.: Vestidos de festa, ajustes, barras..."
              />

            )}


            {!isCliente && (

              <div
                style={{
                  gridColumn:
                    '1 / -1'
                }}
              >

                <Campo
                  label="Endereço de Atendimento / Ateliê *"

                  type="text"

                  name="endereco"

                  value={
                    formData.endereco
                  }

                  onChange={
                    handleChange
                  }

                  disabled={
                    !editando
                  }

                  required={
                    !isCliente
                  }

                  placeholder="Ex.: Rua XV de Novembro, 123 - Centro, Ponta Grossa / PR"
                />

              </div>

            )}


            {!isCliente && (

              <div
                style={{
                  gridColumn:
                    '1 / -1'
                }}
              >

                <label
                  style={
                    labelStyle
                  }
                >
                  Bio / Apresentação
                </label>


                <textarea
                  name="bio"

                  rows="4"

                  value={
                    formData.bio
                  }

                  onChange={
                    handleChange
                  }

                  disabled={
                    !editando
                  }

                  placeholder="Descreva brevemente seus serviços e especialidades..."

                  style={{
                    ...inputStyle,

                    minHeight:
                      '105px',

                    resize:
                      'vertical',

                    lineHeight:
                      '1.6',

                    background:
                      editando
                        ? '#FFFFFF'
                        : '#F6F3F4',

                    color:
                      editando
                        ? '#4A424A'
                        : '#7F747B'
                  }}
                />

              </div>

            )}

          </div>


          {/* FOTO - REMOVER */}

          {editando &&
           formData.foto_perfil && (

            <div
              style={{
                marginTop:
                  '15px'
              }}
            >

              <button
                type="button"

                onClick={
                  handleRemoverFoto
                }

                style={{
                  padding:
                    '8px 12px',

                  background:
                    '#FFFFFF',

                  color:
                    '#9B5D5D',

                  border:
                    '1px solid #E9CFCF',

                  borderRadius:
                    '7px',

                  fontSize:
                    '9px',

                  fontWeight:
                    '700',

                  cursor:
                    'pointer'
                }}
              >
                Remover foto
              </button>

            </div>

          )}


          {/* PRIVACIDADE */}

          {!isCliente &&
           editando && (

            <div
              style={{
                marginTop:
                  '18px',

                padding:
                  '13px 15px',

                background:
                  '#FAF7F9',

                color:
                  '#65515F',

                border:
                  '1px solid #E9DDE5',

                borderLeft:
                  '3px solid #917687',

                borderRadius:
                  '8px',

                fontSize:
                  '10px',

                lineHeight:
                  '1.6'
              }}
            >

              <strong
                style={{
                  display:
                    'block',

                  marginBottom:
                    '3px',

                  color:
                    '#5E4557',

                  fontSize:
                    '10px'
                }}
              >
                Privacidade dos seus dados
              </strong>

              Seus dados de contato e
              endereço (
              <strong>
                com exceção do CPF/CNPJ
              </strong>
              , que é confidencial e
              nunca é compartilhado) só
              ficarão visíveis para as
              clientes com quem você
              firmar pedido.

            </div>

          )}


          {/* AÇÕES DE EDIÇÃO */}

          {editando && (

            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'flex-end',

                gap:
                  '9px',

                marginTop:
                  '24px',

                paddingTop:
                  '20px',

                borderTop:
                  '1px solid #EEE7E3'
              }}
            >

              <button
                type="button"

                onClick={() =>
                  setEditando(
                    false
                  )
                }

                style={{
                  padding:
                    '10px 15px',

                  background:
                    '#FFFFFF',

                  color:
                    '#7A5B72',

                  border:
                    '1px solid #D8CFD5',

                  borderRadius:
                    '8px',

                  fontSize:
                    '10px',

                  fontWeight:
                    '700',

                  cursor:
                    'pointer'
                }}
              >
                Cancelar
              </button>


              <button
                type="submit"

                disabled={
                  carregando
                }

                style={{
                  padding:
                    '10px 16px',

                  background:
                    '#7A5B72',

                  color:
                    '#FFFFFF',

                  border:
                    'none',

                  borderRadius:
                    '8px',

                  fontSize:
                    '10px',

                  fontWeight:
                    '700',

                  cursor:
                    carregando
                      ? 'not-allowed'
                      : 'pointer',

                  opacity:
                    carregando
                      ? 0.65
                      : 1
                }}
              >
                {carregando
                  ? 'Salvando...'
                  : 'Salvar alterações'}
              </button>

            </div>

          )}

        </div>

      </form>


      {/* =====================================
          REPUTAÇÃO
          SOMENTE COSTUREIRA
      ====================================== */}

      {!isCliente && (

        <section
          style={{
            marginBottom:
              '24px',

            padding:
              '22px',

            background:
              '#FFFFFF',

            border:
              '1px solid #EBE5E0',

            borderRadius:
              '13px',

            boxShadow:
              '0 7px 20px rgba(62,36,69,0.05)'
          }}
        >

          <span
            style={{
              display:
                'block',

              marginBottom:
                '5px',

              color:
                '#917687',

              fontSize:
                '9px',

              fontWeight:
                '700',

              letterSpacing:
                '1px',

              textTransform:
                'uppercase'
            }}
          >
            Reputação
          </span>


          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'space-between',

              gap:
                '20px',

              flexWrap:
                'wrap'
            }}
          >

            <div>

              <h2
                style={{
                  margin:
                    0,

                  color:
                    '#3E2445',

                  fontFamily:
                    "'Playfair Display', Georgia, serif",

                  fontSize:
                    '19px'
                }}
              >
                Avaliações
              </h2>


              <p
                style={{
                  margin:
                    '5px 0 0',

                  color:
                    '#91858E',

                  fontSize:
                    '10px'
                }}
              >
                Opiniões de clientes sobre
                os serviços realizados.
              </p>

            </div>


            <div
              style={{
                display:
                  'flex',

              alignItems:
                'center',

              gap:
                '12px'
              }}
            >

              <strong
                style={{
                  color:
                    '#3E2445',

                  fontFamily:
                    "'Playfair Display', Georgia, serif",

                  fontSize:
                    '30px'
                }}
              >
                {reputacao.media
                  ? Number(
                      reputacao.media
                    ).toFixed(1)
                  : '0.0'}
              </strong>


              <div>

                <div
                  style={{
                    color:
                      '#BB91AD',

                    fontSize:
                      '14px',

                    letterSpacing:
                      '1px'
                  }}
                >
                  {
                    renderEstrelas(
                      reputacao.media
                    )
                  }
                </div>


                <span
                  style={{
                    color:
                      '#9A8E96',

                    fontSize:
                      '9px'
                  }}
                >
                  {
                    reputacao.totalAvaliacoes ||
                    0
                  } avaliações
                </span>

              </div>

            </div>

          </div>

        </section>

      )}


      {/* =====================================
          AGENDA
          SOMENTE COSTUREIRA
      ====================================== */}

      {!isCliente && (

        <Agenda
          idUsuario={
            idUsuario
          }

          isCliente={
            false
          }
        />

      )}


      {/* =====================================
          DEPOIMENTOS
          SOMENTE COSTUREIRA
      ====================================== */}

      {!isCliente &&
       reputacao.depoimentos &&
       reputacao.depoimentos.length > 0 && (

        <section
          style={{
            marginTop:
              '24px',

            marginBottom:
              '24px',

            padding:
              '22px',

            background:
              '#FFFFFF',

            border:
              '1px solid #EBE5E0',

            borderRadius:
              '13px',

            boxShadow:
              '0 7px 20px rgba(62,36,69,0.05)'
          }}
        >

          <span
            style={{
              display:
                'block',

              marginBottom:
                '5px',

              color:
                '#917687',

              fontSize:
                '9px',

              fontWeight:
                '700',

              letterSpacing:
                '1px',

              textTransform:
                'uppercase'
            }}
          >
            Experiências
          </span>


          <h2
            style={{
              margin:
                '0 0 16px',

              color:
                '#3E2445',

              fontFamily:
                "'Playfair Display', Georgia, serif",

              fontSize:
                '19px'
            }}
          >
            Depoimentos dos clientes
          </h2>


          {reputacao.depoimentos.map(
            (dep, index) => (

              <div
                key={
                  dep.id ||
                  index
                }

                style={{
                  padding:
                    '13px 0',

                  borderBottom:
                    index ===
                    reputacao.depoimentos.length - 1
                      ? 'none'
                      : '1px solid #F0EAE7'
                }}
              >

                <div
                  style={{
                    display:
                      'flex',

                    justifyContent:
                      'space-between',

                    alignItems:
                      'center',

                    gap:
                      '12px'
                  }}
                >

                  <strong
                    style={{
                      color:
                        '#5E4557',

                      fontSize:
                        '11px'
                    }}
                  >
                    {
                      dep.clienteNome ||
                      dep.nome_cliente ||
                      'Cliente'
                    }
                  </strong>


                  <span
                    style={{
                      color:
                        '#BB91AD',

                      fontSize:
                        '12px'
                    }}
                  >
                    {
                      renderEstrelas(
                        dep.nota
                      )
                    }
                  </span>

                </div>


                {dep.comentario && (

                  <p
                    style={{
                      margin:
                        '7px 0 5px',

                      color:
                        '#6F646B',

                      fontSize:
                        '11px',

                      lineHeight:
                        '1.6'
                    }}
                  >
                    “{dep.comentario}”
                  </p>

                )}


                <span
                  style={{
                    color:
                      '#A0949C',

                    fontSize:
                      '9px'
                  }}
                >
                  {dep.data
                    ? new Date(
                        dep.data
                      ).toLocaleDateString(
                        'pt-BR'
                      )
                    : ''}
                </span>

              </div>

            )
          )}

        </section>

      )}


      {/* =====================================
          TABELA DE PREÇOS + PORTFÓLIO
          SOMENTE COSTUREIRA
      ====================================== */}

      {!isCliente && (

        <>

          <TabelaPrecos
            modoEdicao={
              editando
            }

            idCostureira={
              idUsuario
            }
          />


          <Portfolio
            idCostureira={
              idUsuario
            }

            modoEdicao={
              editando
            }
          />

        </>

      )}


      {/* SAIR */}

      <div
        style={{
          marginTop:
            '30px',

          paddingTop:
            '20px',

          borderTop:
            '1px solid #EDE5E8'
        }}
      >

        <button
          type="button"

          onClick={
            handleLogout
          }

          style={{
            width:
              '100%',

            padding:
              '10px',

            background:
              '#FFF7F7',

            color:
              '#9B5D5D',

            border:
              '1px solid #E9CFCF',

            borderRadius:
              '8px',

            fontSize:
              '10px',

            fontWeight:
              '700',

            cursor:
              'pointer'
          }}
        >
          Sair da conta
        </button>

      </div>

    </div>

  );

}


/* ========================================
   CAMPO VISUAL
======================================== */

function Campo({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false
}) {

  return (

    <div>

      <label
        style={
          labelStyle
        }
      >
        {label}
      </label>


      <input
        type={
          type
        }

        name={
          name
        }

        value={
          value
        }

        onChange={
          onChange
        }

        placeholder={
          placeholder
        }

        disabled={
          disabled
        }

        required={
          required
        }

        style={{
          ...inputStyle,

          background:
            disabled
              ? '#F6F3F4'
              : '#FFFFFF',

          color:
            disabled
              ? '#7F747B'
              : '#4A424A'
        }}
      />

    </div>

  );

}


/* ========================================
   ESTILOS
======================================== */

const labelStyle = {
  display:
    'block',

  marginBottom:
    '6px',

  color:
    '#5F525C',

  fontSize:
    '10px',

  fontWeight:
    '700'
};


const inputStyle = {
  width:
    '100%',

  padding:
    '11px 12px',

  boxSizing:
    'border-box',

  color:
    '#4A424A',

  border:
    '1px solid #DED6D1',

  borderRadius:
    '8px',

  fontFamily:
    "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

  fontSize:
    '11px',

  outline:
    'none'
};


export default Perfil;