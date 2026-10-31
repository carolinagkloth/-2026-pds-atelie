import React, { useEffect, useState } from 'react';

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


  const [formData, setFormData] =
    useState({
      nome:
        user?.nome || '',

      email:
        user?.email || '',

      telefone:
        user?.telefone || '',

      endereco:
        user?.endereco || '',

      bio:
        user?.bio || '',

      foto_perfil:
        user?.foto_perfil || ''
    });


  /*
    Estes dados são apenas lidos caso
    futuramente a API passe a fornecê-los.

    Não estamos inventando nem salvando
    nada no backend da Carolina.
  */

  const [dadosProfissionais, setDadosProfissionais] =
    useState({
      especialidades:
        user?.especialidades || '',

      precos:
        Array.isArray(user?.precos)
          ? user.precos
          : [],

      portfolio:
        Array.isArray(user?.portfolio)
          ? user.portfolio
          : [],

      avaliacao:
        user?.avaliacao_media ??
        user?.avaliacaoMedia ??
        null,

      totalAvaliacoes:
        user?.total_avaliacoes ??
        user?.totalAvaliacoes ??
        0
    });


  /* ========================================
     CARREGAR PERFIL
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

          foto_perfil:
            data.foto_perfil ||
            user?.foto_perfil ||
            ''
        });


        setDadosProfissionais({
          especialidades:
            data.especialidades ||
            user?.especialidades ||
            '',

          precos:
            Array.isArray(data.precos)
              ? data.precos
              : (
                  Array.isArray(user?.precos)
                    ? user.precos
                    : []
                ),

          portfolio:
            Array.isArray(data.portfolio)
              ? data.portfolio
              : (
                  Array.isArray(user?.portfolio)
                    ? user.portfolio
                    : []
                ),

          avaliacao:
            data.avaliacao_media ??
            data.avaliacaoMedia ??
            user?.avaliacao_media ??
            user?.avaliacaoMedia ??
            null,

          totalAvaliacoes:
            data.total_avaliacoes ??
            data.totalAvaliacoes ??
            user?.total_avaliacoes ??
            user?.totalAvaliacoes ??
            0
        });

      })

      .catch(() => {});

  }, [idUsuario]);


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
     FOTO
  ======================================== */

  const primeiraLetra = (
    formData.nome ||
    user?.nome ||
    'U'
  )
    .trim()
    .charAt(0)
    .toUpperCase();


  /* ========================================
     ESTILOS
  ======================================== */

  const inputStyle = {
    width: '100%',
    padding: '11px 12px',
    boxSizing: 'border-box',

    background: '#FFFFFF',
    color: '#4A424A',

    border:
      '1px solid #DED6D1',

    borderRadius: '8px',

    fontFamily:
      "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

    fontSize: '12px',

    outline: 'none'
  };


  const labelStyle = {
    display: 'block',

    marginBottom: '6px',

    color: '#5F525C',

    fontSize: '10px',

    fontWeight: '700'
  };


  /* ========================================
     PERFIL DO CLIENTE
  ======================================== */

  if (!isCostureira) {

    return (

      <div
        style={{
          width:
            'min(900px, 92%)',

          margin:
            '38px auto 70px',

          fontFamily:
            "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

          color:
            '#4A424A'
        }}
      >

        <div
          style={{
            display: 'flex',

            justifyContent:
              'space-between',

            alignItems:
              'flex-end',

            marginBottom:
              '25px',

            gap:
              '20px'
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
              Minha conta
            </span>

            <h1
              style={{
                margin: 0,

                color:
                  '#3E2445',

                fontFamily:
                  "'Playfair Display', Georgia, serif",

                fontSize:
                  '34px'
              }}
            >
              Meu perfil
            </h1>

          </div>


          <button
            type="button"
            onClick={
              handleVoltar
            }
            style={{
              padding:
                '9px 15px',

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

        </div>


        <form
          onSubmit={
            handleSubmit
          }
          style={{
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

          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                '20px',

              padding:
                '28px',

              background:
                '#FAF8F7'
            }}
          >

            <FotoPerfil
              formData={
                formData
              }

              erroImagem={
                erroImagem
              }

              setErroImagem={
                setErroImagem
              }

              primeiraLetra={
                primeiraLetra
              }

              editando={
                editando
              }

              handleFotoChange={
                handleFotoChange
              }
            />


            <div
              style={{
                flex: 1
              }}
            >

              <span
                style={{
                  color:
                    '#917687',

                  fontSize:
                    '9px',

                  fontWeight:
                    '700',

                  textTransform:
                    'uppercase'
                }}
              >
                Cliente
              </span>


              <h2
                style={{
                  margin:
                    '5px 0 3px',

                  color:
                    '#3E2445',

                  fontFamily:
                    "'Playfair Display', Georgia, serif"
                }}
              >
                {
                  formData.nome ||
                  'Usuário'
                }
              </h2>


              <span
                style={{
                  color:
                    '#91858E',

                  fontSize:
                    '11px'
                }}
              >
                {
                  formData.email
                }
              </span>

            </div>


            {
              !editando &&
              (

                <button
                  type="button"
                  onClick={
                    handleIniciarEdicao
                  }
                  style={botaoPrincipal}
                >
                  Editar perfil
                </button>

              )
            }

          </div>


          <div
            style={{
              padding:
                '28px'
            }}
          >

            <FormularioPerfil
              editando={
                editando
              }

              formData={
                formData
              }

              handleChange={
                handleChange
              }

              inputStyle={
                inputStyle
              }

              labelStyle={
                labelStyle
              }

              mostrarBio={
                false
              }
            />


            {
              editando &&
              (

                <AcoesEdicao
                  carregando={
                    carregando
                  }

                  handleCancelar={
                    handleCancelar
                  }
                />

              )
            }

          </div>

        </form>

      </div>

    );

  }


  /* ========================================
     PERFIL PROFISSIONAL DA COSTUREIRA
  ======================================== */

  return (

    <div
      style={{
        width:
          'min(1120px, 94%)',

        margin:
          '38px auto 70px',

        fontFamily:
          "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

        color:
          '#4A424A'
      }}
    >


      {/* TÍTULO */}

      <section
        style={{
          display:
            'flex',

          justifyContent:
            'space-between',

          alignItems:
            'flex-end',

          gap:
            '25px',

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
            Perfil profissional
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
            Meu perfil
          </h1>


          <p
            style={{
              margin:
                '8px 0 0',

              color:
                '#857885',

              fontSize:
                '13px'
            }}
          >
            Sua vitrine profissional dentro do Ateliê Entre Linhas.
          </p>

        </div>


        <button
          type="button"
          onClick={
            handleVoltar
          }
          style={{
            padding:
              '9px 15px',

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
          ← Voltar aos pedidos
        </button>

      </section>



      {
        mensagem &&
        (

          <div
            style={mensagemSucesso}
          >
            {mensagem}
          </div>

        )
      }


      {
        erro &&
        (

          <div
            style={mensagemErro}
          >
            {erro}
          </div>

        )
      }



      {/* ==================================
          PERFIL PRINCIPAL
      ================================== */}

      <form
        onSubmit={
          handleSubmit
        }
        style={{
          marginBottom:
            '22px',

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


        <div
          style={{
            display:
              'grid',

            gridTemplateColumns:
              'auto minmax(0, 1fr) auto',

            gap:
              '25px',

            alignItems:
              'start',

            padding:
              '30px'
          }}
        >


          <FotoPerfil
            formData={
              formData
            }

            erroImagem={
              erroImagem
            }

            setErroImagem={
              setErroImagem
            }

            primeiraLetra={
              primeiraLetra
            }

            editando={
              editando
            }

            handleFotoChange={
              handleFotoChange
            }
          />



          {/* DADOS PROFISSIONAIS */}

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
              Costureira
            </span>


            <h2
              style={{
                margin:
                  '0 0 14px',

                color:
                  '#3E2445',

                fontFamily:
                  "'Playfair Display', Georgia, serif",

                fontSize:
                  '26px'
              }}
            >
              {
                formData.nome ||
                'Costureira'
              }
            </h2>



            {/* LOCAL */}

            <div
              style={{
                marginBottom:
                  '14px'
              }}
            >

              <strong
                style={{
                  display:
                    'block',

                  marginBottom:
                    '4px',

                  color:
                    '#625762',

                  fontSize:
                    '10px'
                }}
              >
                Local de atendimento
              </strong>


              <span
                style={{
                  color:
                    '#857885',

                  fontSize:
                    '11px',

                  lineHeight:
                    '1.6'
                }}
              >
                {
                  formData.endereco ||
                  'Local de atendimento não informado.'
                }
              </span>

            </div>



            {/* ESPECIALIDADES */}

            {
              dadosProfissionais.especialidades &&
              (

                <p
                  style={{
                    margin:
                      '0 0 12px',

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
                  </strong>
                  {' '}
                  {
                    dadosProfissionais.especialidades
                  }
                </p>

              )
            }



            {/* BIO */}

            <p
              style={{
                maxWidth:
                  '650px',

                margin:
                  0,

                color:
                  formData.bio
                    ? '#625962'
                    : '#A0949C',

                fontSize:
                  '12px',

                lineHeight:
                  '1.7'
              }}
            >
              {
                formData.bio ||
                'Adicione uma apresentação para contar aos clientes sobre seu trabalho, experiência e especialidades.'
              }
            </p>



            {/* AVALIAÇÃO RESUMO */}

            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  '9px',

                marginTop:
                  '16px'
              }}
            >

              {
                dadosProfissionais.avaliacao !== null
                  ? (

                    <>

                      <strong
                        style={{
                          color:
                            '#7A5B72',

                          fontSize:
                            '12px'
                        }}
                      >
                        ★ {
                          dadosProfissionais.avaliacao
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
                          dadosProfissionais.totalAvaliacoes
                        } avaliações
                      </span>

                    </>

                  )
                  : (

                    <span
                      style={{
                        color:
                          '#A0949C',

                        fontSize:
                          '10px'
                      }}
                    >
                      Ainda não há avaliações.
                    </span>

                  )
              }

            </div>

          </div>



          {
            !editando &&
            (

              <button
                type="button"
                onClick={
                  handleIniciarEdicao
                }
                style={botaoPrincipal}
              >
                Editar perfil
              </button>

            )
          }

        </div>



        {/* EDIÇÃO */}

        {
          editando &&
          (

            <div
              style={{
                padding:
                  '25px 30px',

                background:
                  '#FAF8F7',

                borderTop:
                  '1px solid #EEE7E3'
              }}
            >

              <FormularioPerfil
                editando={
                  true
                }

                formData={
                  formData
                }

                handleChange={
                  handleChange
                }

                inputStyle={
                  inputStyle
                }

                labelStyle={
                  labelStyle
                }

                mostrarBio={
                  true
                }
              />


              <AcoesEdicao
                carregando={
                  carregando
                }

                handleCancelar={
                  handleCancelar
                }
              />

            </div>

          )
        }

      </form>



      {/* ==================================
          PREÇOS + AVALIAÇÃO
      ================================== */}

      <section
        style={{
          display:
            'grid',

          gridTemplateColumns:
            'minmax(0, 1.65fr) minmax(250px, 0.75fr)',

          gap:
            '18px',

          marginBottom:
            '35px'
        }}
      >


        {/* TABELA DE PREÇOS */}

        <div
          style={cardStyle}
        >

          <div
            style={{
              marginBottom:
                '18px'
            }}
          >

            <span
              style={eyebrowStyle}
            >
              Serviços
            </span>


            <h2
              style={tituloSecaoStyle}
            >
              Tabela de preços
            </h2>

          </div>


          {
            dadosProfissionais.precos.length > 0
              ? (

                <div>

                  {
                    dadosProfissionais.precos.map(
                      (
                        preco,
                        index
                      ) => (

                        <div
                          key={
                            preco.id ||
                            index
                          }
                          style={{
                            display:
                              'flex',

                            justifyContent:
                              'space-between',

                            gap:
                              '15px',

                            padding:
                              '11px 0',

                            borderBottom:
                              '1px solid #F0EAE7'
                          }}
                        >

                          <span
                            style={{
                              color:
                                '#625962',

                              fontSize:
                                '11px'
                            }}
                          >
                            {
                              preco.servico ||
                              preco.nome
                            }
                          </span>


                          <strong
                            style={{
                              color:
                                '#7A5B72',

                              fontSize:
                                '11px'
                            }}
                          >
                            {
                              preco.valor
                            }
                          </strong>

                        </div>

                      )
                    )
                  }


                  <p
                    style={{
                      margin:
                        '14px 0 0',

                      color:
                        '#A0949C',

                      fontSize:
                        '9px',

                      lineHeight:
                        '1.5'
                    }}
                  >
                    Os valores podem variar de acordo com tecido,
                    complexidade e prazo.
                  </p>

                </div>

              )
              : (

                <div
                  style={estadoVazioStyle}
                >

                  <strong
                    style={{
                      display:
                        'block',

                      marginBottom:
                        '5px',

                      color:
                        '#6E5E68',

                      fontSize:
                        '11px'
                    }}
                  >
                    Nenhum preço cadastrado
                  </strong>


                  <span
                    style={{
                      color:
                        '#9A8E96',

                      fontSize:
                        '10px',

                      lineHeight:
                        '1.5'
                    }}
                  >
                    A tabela aparecerá aqui quando os preços
                    estiverem disponíveis.
                  </span>

                </div>

              )
          }

        </div>



        {/* AVALIAÇÃO */}

        <div
          style={cardStyle}
        >

          <span
            style={eyebrowStyle}
          >
            Reputação
          </span>


          <h2
            style={tituloSecaoStyle}
          >
            Avaliação
          </h2>


          {
            dadosProfissionais.avaliacao !== null
              ? (

                <div
                  style={{
                    marginTop:
                      '22px',

                    textAlign:
                      'center'
                  }}
                >

                  <strong
                    style={{
                      display:
                        'block',

                      color:
                        '#3E2445',

                      fontFamily:
                        "'Playfair Display', Georgia, serif",

                      fontSize:
                        '38px'
                    }}
                  >
                    {
                      dadosProfissionais.avaliacao
                    }
                  </strong>


                  <div
                    style={{
                      margin:
                        '5px 0',

                      color:
                        '#BB91AD',

                      letterSpacing:
                        '2px',

                      fontSize:
                        '16px'
                    }}
                  >
                    ★★★★★
                  </div>


                  <span
                    style={{
                      color:
                        '#9A8E96',

                      fontSize:
                        '10px'
                    }}
                  >
                    Baseado em {
                      dadosProfissionais.totalAvaliacoes
                    } avaliações
                  </span>

                </div>

              )
              : (

                <div
                  style={{
                    ...estadoVazioStyle,

                    marginTop:
                      '18px',

                    textAlign:
                      'center'
                  }}
                >

                  <strong
                    style={{
                      display:
                        'block',

                      marginBottom:
                        '5px',

                      color:
                        '#6E5E68',

                      fontSize:
                        '11px'
                    }}
                  >
                    Sem avaliações ainda
                  </strong>


                  <span
                    style={{
                      color:
                        '#9A8E96',

                      fontSize:
                        '10px',

                      lineHeight:
                        '1.5'
                    }}
                  >
                    As avaliações aparecerão após
                    serviços finalizados.
                  </span>

                </div>

              )
          }

        </div>

      </section>



      {/* ==================================
          PORTFÓLIO
      ================================== */}

      <section>

        <div
          style={{
            marginBottom:
              '18px'
          }}
        >

          <span
            style={eyebrowStyle}
          >
            Meu trabalho
          </span>


          <h2
            style={{
              ...tituloSecaoStyle,

              fontSize:
                '25px'
            }}
          >
            Portfólio
          </h2>


          <p
            style={{
              margin:
                '5px 0 0',

              color:
                '#91858E',

              fontSize:
                '11px'
            }}
          >
            Trabalhos realizados anteriormente.
          </p>

        </div>



        {
          dadosProfissionais.portfolio.length > 0
            ? (

              <div
                style={{
                  display:
                    'grid',

                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(230px, 1fr))',

                  gap:
                    '16px'
                }}
              >

                {
                  dadosProfissionais.portfolio.map(
                    (
                      trabalho,
                      index
                    ) => (

                      <article
                        key={
                          trabalho.id ||
                          index
                        }
                        style={{
                          overflow:
                            'hidden',

                          background:
                            '#FFFFFF',

                          border:
                            '1px solid #EBE5E0',

                          borderRadius:
                            '13px',

                          boxShadow:
                            '0 6px 18px rgba(62,36,69,0.04)'
                        }}
                      >

                        <div
                          style={{
                            height:
                              '190px',

                            display:
                              'flex',

                            alignItems:
                              'center',

                            justifyContent:
                              'center',

                            overflow:
                              'hidden',

                            background:
                              '#FAF8F7',

                            color:
                              '#B2A5AD',

                            fontSize:
                              '10px'
                          }}
                        >

                          {
                            trabalho.imagem ||
                            trabalho.foto
                              ? (

                                <img
                                  src={
                                    trabalho.imagem ||
                                    trabalho.foto
                                  }
                                  alt={
                                    trabalho.titulo ||
                                    'Trabalho realizado'
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

                              )
                              : (
                                'Foto do trabalho'
                              )
                          }

                        </div>


                        <div
                          style={{
                            padding:
                              '16px'
                          }}
                        >

                          <h3
                            style={{
                              margin:
                                '0 0 6px',

                              color:
                                '#3E2445',

                              fontFamily:
                                "'Playfair Display', Georgia, serif",

                              fontSize:
                                '16px'
                            }}
                          >
                            {
                              trabalho.titulo ||
                              'Trabalho realizado'
                            }
                          </h3>


                          <p
                            style={{
                              margin:
                                0,

                              color:
                                '#857885',

                              fontSize:
                                '10px',

                              lineHeight:
                                '1.6'
                            }}
                          >
                            {
                              trabalho.descricao ||
                              ''
                            }
                          </p>

                        </div>

                      </article>

                    )
                  )
                }

              </div>

            )
            : (

              <div
                style={{
                  padding:
                    '45px 25px',

                  background:
                    '#FFFFFF',

                  border:
                    '1px dashed #D9CCD5',

                  borderRadius:
                    '13px',

                  textAlign:
                    'center'
                }}
              >

                <div
                  style={{
                    width:
                      '43px',

                    height:
                      '43px',

                    margin:
                      '0 auto 11px',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',

                    background:
                      '#F3ECEF',

                    color:
                      '#7A5B72',

                    borderRadius:
                      '50%',

                    fontSize:
                      '18px'
                  }}
                >
                  ✂
                </div>


                <h3
                  style={{
                    margin:
                      '0 0 5px',

                    color:
                      '#3E2445',

                    fontFamily:
                      "'Playfair Display', Georgia, serif",

                    fontSize:
                      '17px'
                  }}
                >
                  Seu portfólio ainda está vazio
                </h3>


                <p
                  style={{
                    margin:
                      0,

                    color:
                      '#91858E',

                    fontSize:
                      '10px'
                  }}
                >
                  Os trabalhos cadastrados aparecerão aqui.
                </p>

              </div>

            )
        }

      </section>

    </div>

  );

}


/* ========================================
   COMPONENTE FOTO
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

    <div
      style={{
        position:
          'relative',

        flexShrink:
          0
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

        {
          formData.foto_perfil &&
          !erroImagem
            ? (

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

            )
            : (

              <span
                style={{
                  color:
                    '#FFFFFF',

                  fontFamily:
                    "'Playfair Display', Georgia, serif",

                  fontSize:
                    '40px',

                  fontWeight:
                    '700'
                }}
              >
                {primeiraLetra}
              </span>

            )
        }

      </div>


      {
        editando &&
        (

          <>

            <label
              htmlFor="perfil-foto-upload"
              title="Alterar foto"
              style={{
                position:
                  'absolute',

                right:
                  '0',

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


            <input
              id="perfil-foto-upload"
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

          </>

        )
      }

    </div>

  );

}


/* ========================================
   FORMULÁRIO
======================================== */

function FormularioPerfil({
  formData,
  handleChange,
  inputStyle,
  labelStyle,
  mostrarBio
}) {

  return (

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

      <div>

        <label
          style={
            labelStyle
          }
        >
          Nome
        </label>


        <input
          type="text"
          name="nome"
          value={
            formData.nome
          }
          onChange={
            handleChange
          }
          required
          style={
            inputStyle
          }
        />

      </div>



      <div>

        <label
          style={
            labelStyle
          }
        >
          E-mail
        </label>


        <input
          type="email"
          value={
            formData.email
          }
          disabled
          style={{
            ...inputStyle,

            background:
              '#F3F0F1',

            color:
              '#8E858B'
          }}
        />

      </div>



      <div>

        <label
          style={
            labelStyle
          }
        >
          Telefone / WhatsApp
        </label>


        <input
          type="text"
          name="telefone"
          value={
            formData.telefone
          }
          onChange={
            handleChange
          }
          placeholder="(42) 99999-9999"
          style={
            inputStyle
          }
        />

      </div>



      <div>

        <label
          style={
            labelStyle
          }
        >
          {
            mostrarBio
              ? 'Local de atendimento'
              : 'Endereço / Cidade'
          }
        </label>


        <input
          type="text"
          name="endereco"
          value={
            formData.endereco
          }
          onChange={
            handleChange
          }
          placeholder="Ex.: Centro - Ponta Grossa / PR"
          style={
            inputStyle
          }
        />

      </div>



      {
        mostrarBio &&
        (

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
              Sobre mim
            </label>


            <textarea
              name="bio"
              rows="5"
              value={
                formData.bio
              }
              onChange={
                handleChange
              }
              placeholder="Conte sobre sua experiência, serviços e especialidades..."
              style={{
                ...inputStyle,

                minHeight:
                  '120px',

                resize:
                  'vertical',

                lineHeight:
                  '1.6'
              }}
            />

          </div>

        )
      }

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
        onClick={
          handleCancelar
        }
        style={{
          padding:
            '10px 16px',

          background:
            '#FFFFFF',

          color:
            '#6A5965',

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
            '10px 17px',

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
   ESTILOS COMPARTILHADOS
======================================== */

const botaoPrincipal = {
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
};


const cardStyle = {
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
};


const eyebrowStyle = {
  display:
    'block',

  marginBottom:
    '4px',

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
};


const tituloSecaoStyle = {
  margin:
    0,

  color:
    '#3E2445',

  fontFamily:
    "'Playfair Display', Georgia, serif",

  fontSize:
    '19px'
};


const estadoVazioStyle = {
  padding:
    '20px',

  background:
    '#FAF8F7',

  border:
    '1px dashed #D9CCD5',

  borderRadius:
    '9px'
};


const mensagemSucesso = {
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
};


const mensagemErro = {
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
};


export default Perfil;