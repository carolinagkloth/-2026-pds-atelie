import React, { useState, useEffect } from 'react';


function Portfolio({
  idCostureira,
  modoEdicao = false,
  onNavigate
}) {

  const [itens, setItens] =
    useState([]);

  const [costureiraInfo, setCostureiraInfo] =
    useState(null);

  const [precos, setPrecos] =
    useState([]);

  const [reputacao, setReputacao] =
    useState({
      media: 0,
      totalAvaliacoes: 0,
      depoimentos: []
    });


  const [carregando, setCarregando] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const [erro, setErro] =
    useState('');

  const [erroModal, setErroModal] =
    useState('');

  const [erroFotoPerfil, setErroFotoPerfil] =
    useState(false);

  const [
    idConfirmandoExclusao,
    setIdConfirmandoExclusao
  ] = useState(null);


  const [titulo, setTitulo] =
    useState('');

  const [imagemBase64, setImagemBase64] =
    useState('');

  const [mostrarModalAdd, setMostrarModalAdd] =
    useState(false);


  /* ========================================
     LÓGICA ATUAL DA CAROLINA
  ======================================== */

  const exibirPerfilCompleto =
    Boolean(onNavigate) &&
    !modoEdicao;


  useEffect(() => {

    if (!idCostureira) {
      return;
    }


    const carregarDados = async () => {

      setCarregando(true);

      setErroFotoPerfil(false);


      try {

        const requisicoes = [

          fetch(
            `/api/portfolio/${idCostureira}`
          ),

          fetch(
            `/api/usuarios/${idCostureira}`
          ).catch(() => null)

        ];


        if (exibirPerfilCompleto) {

          requisicoes.push(

            fetch(
              `/api/usuarios/${idCostureira}/tabela-precos`
            ).catch(() => null),

            fetch(
              `/api/avaliacoes/costureira/${idCostureira}`
            ).catch(() => null)

          );

        }


        const [
          resPortfolio,
          resUser,
          resPrecos,
          resAvaliacoes
        ] =
          await Promise.all(
            requisicoes
          );


        const dataPortfolio =
          await resPortfolio.json();


        if (!resPortfolio.ok) {

          throw new Error(
            dataPortfolio.erro ||
            'Erro ao carregar galeria.'
          );

        }


        setItens(
          Array.isArray(
            dataPortfolio
          )
            ? dataPortfolio
            : []
        );


        if (
          resUser &&
          resUser.ok
        ) {

          const dataUser =
            await resUser.json();


          setCostureiraInfo(
            dataUser
          );

        }


        if (
          resPrecos &&
          resPrecos.ok
        ) {

          const dataPrecos =
            await resPrecos.json();


          setPrecos(
            Array.isArray(
              dataPrecos
            )
              ? dataPrecos
              : []
          );

        }


        if (
          resAvaliacoes &&
          resAvaliacoes.ok
        ) {

          const dataAval =
            await resAvaliacoes.json();


          if (
            dataAval &&
            !dataAval.erro
          ) {

            setReputacao({

              media:
                dataAval.media ||
                dataAval.media_nota ||
                0,

              totalAvaliacoes:
                dataAval.totalAvaliacoes ||
                dataAval.total_avaliacoes ||
                0,

              depoimentos:
                dataAval.depoimentos ||
                dataAval.avaliacoes ||
                []

            });

          }

        }

      } catch (err) {

        setErro(
          err.message
        );

      } finally {

        setCarregando(false);

      }

    };


    carregarDados();

  }, [
    idCostureira,
    exibirPerfilCompleto
  ]);


  const handleFileChange = (e) => {

    const file =
      e.target.files[0];


    if (file) {

      setErroModal('');


      const reader =
        new FileReader();


      reader.onloadend = () => {

        setImagemBase64(
          reader.result
        );

      };


      reader.readAsDataURL(
        file
      );

    }

  };


  const handleAbrirModalAdd = () => {

    setTitulo('');
    setImagemBase64('');
    setErroModal('');
    setMostrarModalAdd(true);

  };


  const handleSalvar = async (e) => {

    e.preventDefault();

    setErroModal('');


    if (!imagemBase64) {

      setErroModal(
        'Selecione uma imagem antes de publicar.'
      );

      return;

    }


    setEnviando(true);


    try {

      const response =
        await fetch(
          '/api/portfolio',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                id_costureira:
                  idCostureira,

                url_imagem:
                  imagemBase64,

                titulo_trabalho:
                  titulo
              })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.erro ||
          'Erro ao salvar item.'
        );

      }


      setTitulo('');
      setImagemBase64('');
      setMostrarModalAdd(false);


      const res =
        await fetch(
          `/api/portfolio/${idCostureira}`
        );


      const novosItens =
        await res.json();


      setItens(
        Array.isArray(
          novosItens
        )
          ? novosItens
          : []
      );

    } catch (err) {

      setErroModal(
        err.message
      );

    } finally {

      setEnviando(false);

    }

  };


  const handleExcluir =
    async (idMidia) => {

      setErro('');


      try {

        const response =
          await fetch(
            `/api/portfolio/${idMidia}`,
            {
              method:
                'DELETE'
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.erro ||
            'Erro ao excluir foto.'
          );

        }


        setItens(
          (prev) =>
            prev.filter(
              (item) =>
                (
                  item.id ||
                  item.id_midia ||
                  item.id_portfolio
                ) !== idMidia
            )
        );


        setIdConfirmandoExclusao(
          null
        );

      } catch (err) {

        setErro(
          err.message
        );


        setIdConfirmandoExclusao(
          null
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


  const nomeCostureira =
    costureiraInfo?.nome ||
    'Costureira';


  const primeiraLetra =
    nomeCostureira
      .trim()
      .charAt(0)
      .toUpperCase();


  /* ========================================
     VISUAL
  ======================================== */

  return (

    <div
      style={{
        width:
          exibirPerfilCompleto
            ? 'min(1000px, 94%)'
            : '100%',

        margin:
          exibirPerfilCompleto
            ? '38px auto 70px'
            : '28px 0 0',

        padding:
          0,

        fontFamily:
          "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

        color:
          '#4A424A'
      }}
    >


      {/* VOLTAR */}

      {onNavigate && (

        <button
          type="button"

          onClick={() =>
            onNavigate(
              'meusChats'
            )
          }

          style={{
            height:
              '40px',

            marginBottom:
              '20px',

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
          ← Voltar para conversas
        </button>

      )}


      {/* CARREGAMENTO */}

      {carregando && (

        <div
          style={{
            padding:
              '35px',

            background:
              '#FFFFFF',

            border:
              '1px solid #EBE5E0',

            borderRadius:
              '13px',

            color:
              '#91858E',

            fontSize:
              '11px',

            textAlign:
              'center'
          }}
        >
          Carregando informações da costureira...
        </div>

      )}


      {/* ERRO */}

      {erro && (

        <div
          style={{
            marginBottom:
              '18px',

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


      {/* =====================================
          PERFIL PÚBLICO DA COSTUREIRA
      ====================================== */}

      {!carregando &&
       exibirPerfilCompleto && (

        <>


          {/* PERFIL */}

          <section
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
                  'flex',

                alignItems:
                  'center',

                gap:
                  '24px',

                padding:
                  '30px',

                background:
                  '#FAF8F7',

                flexWrap:
                  'wrap'
              }}
            >


              {/* FOTO */}

              <div
                style={{
                  width:
                    '110px',

                  height:
                    '110px',

                  flexShrink:
                    0,

                  overflow:
                    'hidden',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

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

                {costureiraInfo?.foto_perfil &&
                 !erroFotoPerfil ? (

                  <img
                    src={
                      costureiraInfo.foto_perfil
                    }

                    alt={
                      nomeCostureira
                    }

                    referrerPolicy="no-referrer"

                    onError={() =>
                      setErroFotoPerfil(
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
                        '42px',

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


              {/* INFORMAÇÕES */}

              <div
                style={{
                  flex:
                    1,

                  minWidth:
                    '240px'
                }}
              >

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
                      '0.6px',

                    textTransform:
                      'uppercase'
                  }}
                >
                  Costureira profissional
                </span>


                <h1
                  style={{
                    margin:
                      '0 0 8px',

                    color:
                      '#3E2445',

                    fontFamily:
                      "'Playfair Display', Georgia, serif",

                    fontSize:
                      '29px',

                    lineHeight:
                      '1.15'
                  }}
                >
                  {nomeCostureira}
                </h1>


                {costureiraInfo?.especialidades && (

                  <p
                    style={{
                      margin:
                        '0 0 9px',

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
                      costureiraInfo.especialidades
                    }
                  </p>

                )}


                <div
                  style={{
                    display:
                      'flex',

                    flexDirection:
                      'column',

                    gap:
                      '5px',

                    color:
                      '#70666D',

                    fontSize:
                      '10px',

                    lineHeight:
                      '1.5'
                  }}
                >

                  <span>
                    <strong>
                      Telefone / WhatsApp:
                    </strong>{' '}
                    {
                      costureiraInfo?.telefone ||
                      'Não informado'
                    }
                  </span>


                  <span>
                    <strong>
                      Local de atendimento:
                    </strong>{' '}
                    Compartilhado no chat ao agendar prova da peça
                  </span>

                </div>

              </div>

            </div>


            {costureiraInfo?.bio && (

              <div
                style={{
                  padding:
                    '20px 30px',

                  borderTop:
                    '1px solid #EEE7E3'
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
                  Sobre o trabalho
                </span>


                <p
                  style={{
                    margin:
                      0,

                    color:
                      '#625962',

                    fontSize:
                      '11px',

                    lineHeight:
                      '1.7'
                  }}
                >
                  {
                    costureiraInfo.bio
                  }
                </p>

              </div>

            )}

          </section>


          {/* TABELA DE PREÇOS */}

          {precos.length > 0 && (

            <section
              style={{
                marginBottom:
                  '22px',

                padding:
                  '22px',

                overflow:
                  'hidden',

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
                Serviços
              </span>


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
                Tabela de preços referenciais
              </h2>


              <p
                style={{
                  margin:
                    '5px 0 18px',

                  color:
                    '#91858E',

                  fontSize:
                    '10px'
                }}
              >
                Valores base estimados informados pela costureira.
              </p>


              <div
                style={{
                  overflowX:
                    'auto'
                }}
              >

                <table
                  style={{
                    width:
                      '100%',

                    borderCollapse:
                      'collapse',

                    fontSize:
                      '10px'
                  }}
                >

                  <thead>

                    <tr
                      style={{
                        background:
                          '#F3ECEF',

                        color:
                          '#5E4557',

                        textAlign:
                          'left'
                      }}
                    >

                      <th
                        style={{
                          padding:
                            '10px 12px'
                        }}
                      >
                        Serviço
                      </th>

                      <th
                        style={{
                          padding:
                            '10px 12px'
                        }}
                      >
                        Categoria
                      </th>

                      <th
                        style={{
                          padding:
                            '10px 12px'
                        }}
                      >
                        Valor base
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {precos.map(
                      (item, index) => (

                        <tr
                          key={
                            item.id_preco ||
                            item.id ||
                            index
                          }

                          style={{
                            background:
                              index % 2 === 0
                                ? '#FFFFFF'
                                : '#FAF8F7',

                            borderBottom:
                              '1px solid #EEE7E3'
                          }}
                        >

                          <td
                            style={{
                              padding:
                                '10px 12px',

                              color:
                                '#5F565C'
                            }}
                          >
                            {
                              item.servico
                            }
                          </td>


                          <td
                            style={{
                              padding:
                                '10px 12px',

                              color:
                                '#7B7077'
                            }}
                          >
                            {
                              item.categoria
                            }
                          </td>


                          <td
                            style={{
                              padding:
                                '10px 12px',

                              color:
                                '#6E5568',

                              fontWeight:
                                '700'
                            }}
                          >
                            R$ {
                              Number(
                                item.valor ||
                                0
                              ).toFixed(2)
                            }
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </section>

          )}


          {/* AVALIAÇÕES */}

          <section
            style={{
              marginBottom:
                '22px',

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

            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                gap:
                  '16px',

                marginBottom:
                  '16px',

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
                  Avaliações de clientes
                </h2>

              </div>


              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    '9px',

                  padding:
                    '7px 11px',

                  background:
                    '#FAF7F9',

                  border:
                    '1px solid #E9DDE5',

                  borderRadius:
                    '9px'
                }}
              >

                <strong
                  style={{
                    color:
                      '#3E2445',

                    fontFamily:
                      "'Playfair Display', Georgia, serif",

                    fontSize:
                      '20px'
                  }}
                >
                  {reputacao.media
                    ? Number(
                        reputacao.media
                      ).toFixed(1)
                    : '0.0'}
                </strong>


                <span
                  style={{
                    color:
                      '#BB91AD',

                    fontSize:
                      '13px',

                    letterSpacing:
                      '1px'
                  }}
                >
                  {
                    renderEstrelas(
                      reputacao.media
                    )
                  }
                </span>


                <span
                  style={{
                    color:
                      '#91858E',

                    fontSize:
                      '9px'
                  }}
                >
                  ({
                    reputacao.totalAvaliacoes ||
                    0
                  })
                </span>

              </div>

            </div>


            {!reputacao.depoimentos ||
             reputacao.depoimentos.length === 0 ? (

              <div
                style={{
                  padding:
                    '20px',

                  background:
                    '#FAF8F7',

                  color:
                    '#91858E',

                  border:
                    '1px dashed #D9CCD5',

                  borderRadius:
                    '9px',

                  fontSize:
                    '10px',

                  textAlign:
                    'center'
                }}
              >
                Esta costureira ainda não recebeu avaliações.
              </div>

            ) : (

              <div>

                {reputacao.depoimentos.map(
                  (dep, index) => (

                    <div
                      key={
                        dep.id ||
                        dep.id_avaliacao ||
                        index
                      }

                      style={{
                        padding:
                          '12px 0',

                        borderBottom:
                          index <
                          reputacao.depoimentos.length - 1
                            ? '1px solid #F0EAE7'
                            : 'none'
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
                            '10px'
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
                              '11px'
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
                              '6px 0 4px',

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


                      {(dep.data ||
                        dep.data_avaliacao) && (

                        <span
                          style={{
                            color:
                              '#A0949C',

                            fontSize:
                              '9px'
                          }}
                        >
                          {
                            new Date(
                              dep.data ||
                              dep.data_avaliacao
                            )
                              .toLocaleDateString(
                                'pt-BR'
                              )
                          }
                        </span>

                      )}

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        </>

      )}


      {/* =====================================
          PORTFÓLIO
      ====================================== */}

      <section
        style={{
          padding:
            exibirPerfilCompleto
              ? '22px'
              : '0',

          background:
            '#FFFFFF',

          border:
            exibirPerfilCompleto
              ? '1px solid #EBE5E0'
              : 'none',

          borderRadius:
            exibirPerfilCompleto
              ? '13px'
              : '0',

          boxShadow:
            exibirPerfilCompleto
              ? '0 7px 20px rgba(62,36,69,0.05)'
              : 'none'
        }}
      >


        {/* CABEÇALHO */}

        <div
          style={{
            display:
              'flex',

            justifyContent:
              'space-between',

            alignItems:
              'flex-end',

            gap:
              '18px',

            marginBottom:
              '18px',

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
              }}
            >
              Meu trabalho
            </span>


            <h2
              style={{
                margin:
                  0,

                color:
                  '#3E2445',

                fontFamily:
                  "'Playfair Display', Georgia, serif",

                fontSize:
                  '24px'
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
                  '10px'
              }}
            >
              {modoEdicao
                ? 'Gerencie as fotos dos seus trabalhos para apresentar seus serviços aos clientes.'
                : 'Galeria de trabalhos e peças já confeccionadas.'}
            </p>

          </div>


          {modoEdicao && (

            <button
              type="button"

              onClick={
                handleAbrirModalAdd
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
              + Adicionar foto
            </button>

          )}

        </div>


        {/* VAZIO */}

        {!carregando &&
         itens.length === 0 ? (

          <div
            style={{
              padding:
                '42px 25px',

              background:
                '#FAF8F7',

              border:
                '1px dashed #D9CCD5',

              borderRadius:
                '11px',

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
              Nenhum trabalho publicado
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

        ) : (

          /* GRID */

          <div
            style={{
              display:
                'grid',

              gridTemplateColumns:
                'repeat(auto-fit, minmax(210px, 1fr))',

              gap:
                '16px'
            }}
          >

            {itens.map(
              (item) => {

                const idFoto =
                  item.id ||
                  item.id_midia ||
                  item.id_portfolio;


                const confirmandoEsta =
                  idConfirmandoExclusao ===
                  idFoto;


                return (

                  <article
                    key={
                      idFoto
                    }

                    style={{
                      position:
                        'relative',

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


                    <img
                      src={
                        item.urlImagem ||
                        item.url_imagem
                      }

                      alt={
                        item.tituloTrabalho ||
                        item.titulo_trabalho ||
                        'Trabalho de costura'
                      }

                      style={{
                        width:
                          '100%',

                        height:
                          '200px',

                        display:
                          'block',

                        objectFit:
                          'cover',

                        background:
                          '#FAF8F7'
                      }}
                    />


                    {(item.tituloTrabalho ||
                      item.titulo_trabalho) && (

                      <div
                        style={{
                          padding:
                            '14px 15px',

                          background:
                            '#FFFFFF'
                        }}
                      >

                        <h3
                          style={{
                            margin:
                              0,

                            color:
                              '#3E2445',

                            fontFamily:
                              "'Playfair Display', Georgia, serif",

                            fontSize:
                              '15px',

                            fontWeight:
                              '600'
                          }}
                        >
                          {
                            item.tituloTrabalho ||
                            item.titulo_trabalho
                          }
                        </h3>

                      </div>

                    )}


                    {/* EXCLUIR */}

                    {modoEdicao &&
                     !confirmandoEsta && (

                      <button
                        type="button"

                        onClick={() =>
                          setIdConfirmandoExclusao(
                            idFoto
                          )
                        }

                        title="Excluir foto"

                        style={{
                          position:
                            'absolute',

                          top:
                            '9px',

                          right:
                            '9px',

                          width:
                            '29px',

                          height:
                            '29px',

                          display:
                            'flex',

                          alignItems:
                            'center',

                          justifyContent:
                            'center',

                          padding:
                            0,

                          background:
                            'rgba(255,255,255,0.94)',

                          color:
                            '#9C5D66',

                          border:
                            '1px solid #E7D9DB',

                          borderRadius:
                            '50%',

                          boxShadow:
                            '0 3px 10px rgba(62,36,69,0.12)',

                          fontSize:
                            '13px',

                          fontWeight:
                            '700',

                          cursor:
                            'pointer'
                        }}
                      >
                        ✕
                      </button>

                    )}


                    {/* CONFIRMAÇÃO */}

                    {modoEdicao &&
                     confirmandoEsta && (

                      <div
                        style={{
                          position:
                            'absolute',

                          inset:
                            0,

                          display:
                            'flex',

                          flexDirection:
                            'column',

                          alignItems:
                            'center',

                          justifyContent:
                            'center',

                          gap:
                            '11px',

                          padding:
                            '18px',

                          boxSizing:
                            'border-box',

                          background:
                            'rgba(62,36,69,0.90)',

                          color:
                            '#FFFFFF',

                          textAlign:
                            'center'
                        }}
                      >

                        <strong
                          style={{
                            fontFamily:
                              "'Playfair Display', Georgia, serif",

                            fontSize:
                              '16px'
                          }}
                        >
                          Remover esta foto?
                        </strong>


                        <div
                          style={{
                            display:
                              'flex',

                            gap:
                              '8px'
                          }}
                        >

                          <button
                            type="button"

                            onClick={() =>
                              handleExcluir(
                                idFoto
                              )
                            }

                            style={{
                              padding:
                                '8px 11px',

                              background:
                                '#FFFFFF',

                              color:
                                '#9B5D5D',

                              border:
                                'none',

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
                            Sim, remover
                          </button>


                          <button
                            type="button"

                            onClick={() =>
                              setIdConfirmandoExclusao(
                                null
                              )
                            }

                            style={{
                              padding:
                                '8px 11px',

                              background:
                                'transparent',

                              color:
                                '#FFFFFF',

                              border:
                                '1px solid rgba(255,255,255,0.6)',

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
                            Cancelar
                          </button>

                        </div>

                      </div>

                    )}

                  </article>

                );

              }
            )}

          </div>

        )}

      </section>


      {/* =====================================
          MODAL ADICIONAR FOTO
      ====================================== */}

      {mostrarModalAdd && (

        <div
          style={{
            position:
              'fixed',

            inset:
              0,

            zIndex:
              1200,

            display:
              'flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            padding:
              '20px',

            background:
              'rgba(42,29,40,0.48)',

            backdropFilter:
              'blur(3px)'
          }}
        >

          <div
            style={{
              width:
                'min(460px, 94vw)',

              maxHeight:
                '90vh',

              overflowY:
                'auto',

              padding:
                '24px',

              background:
                '#FFFFFF',

              border:
                '1px solid #EBE5E0',

              borderRadius:
                '15px',

              boxShadow:
                '0 20px 55px rgba(45,30,42,0.22)'
            }}
          >


            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'flex-start',

                gap:
                  '15px',

                marginBottom:
                  '22px'
              }}
            >

              <div>

                <span
                  style={{
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
                  }}
                >
                  Novo trabalho
                </span>


                <h3
                  style={{
                    margin:
                      0,

                    color:
                      '#3E2445',

                    fontFamily:
                      "'Playfair Display', Georgia, serif",

                    fontSize:
                      '22px'
                  }}
                >
                  Publicar no portfólio
                </h3>

              </div>


              <button
                type="button"

                onClick={() =>
                  setMostrarModalAdd(
                    false
                  )
                }

                aria-label="Fechar"

                style={{
                  width:
                    '30px',

                  height:
                    '30px',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  padding:
                    0,

                  background:
                    '#FAF8F7',

                  color:
                    '#7A6875',

                  border:
                    '1px solid #E5DDDF',

                  borderRadius:
                    '50%',

                  fontSize:
                    '18px',

                  cursor:
                    'pointer'
                }}
              >
                ×
              </button>

            </div>


            {erroModal && (

              <div
                style={{
                  marginBottom:
                    '15px',

                  padding:
                    '10px 12px',

                  background:
                    '#FFF1F1',

                  color:
                    '#A43B3B',

                  border:
                    '1px solid #F1D5D5',

                  borderRadius:
                    '8px',

                  fontSize:
                    '10px'
                }}
              >
                {erroModal}
              </div>

            )}


            <form
              onSubmit={
                handleSalvar
              }
            >


              {/* TÍTULO */}

              <div
                style={{
                  marginBottom:
                    '17px'
                }}
              >

                <label
                  style={{
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
                  }}
                >
                  Título / descrição da peça
                </label>


                <input
                  type="text"

                  value={
                    titulo
                  }

                  onChange={(e) =>
                    setTitulo(
                      e.target.value
                    )
                  }

                  placeholder="Ex.: Vestido de festa em cetim"

                  style={{
                    width:
                      '100%',

                    padding:
                      '11px 12px',

                    boxSizing:
                      'border-box',

                    background:
                      '#FFFFFF',

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
                  }}
                />

              </div>


              {/* UPLOAD */}

              <div
                style={{
                  marginBottom:
                    '17px'
                }}
              >

                <label
                  style={{
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
                  }}
                >
                  Foto do trabalho
                </label>


                <label
                  style={{
                    minHeight:
                      '120px',

                    display:
                      'flex',

                    flexDirection:
                      'column',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',

                    padding:
                      '20px',

                    boxSizing:
                      'border-box',

                    background:
                      '#FAF8F7',

                    border:
                      '1px dashed #D5C8D0',

                    borderRadius:
                      '10px',

                    textAlign:
                      'center',

                    cursor:
                      'pointer'
                  }}
                >

                  <span
                    style={{
                      width:
                        '32px',

                      height:
                        '32px',

                      marginBottom:
                        '8px',

                      display:
                        'flex',

                      alignItems:
                        'center',

                      justifyContent:
                        'center',

                      background:
                        '#F0E7EC',

                      color:
                        '#7A5B72',

                      borderRadius:
                        '50%',

                      fontSize:
                        '18px',

                      fontWeight:
                        '600'
                    }}
                  >
                    +
                  </span>


                  <strong
                    style={{
                      color:
                        '#625762',

                      fontSize:
                        '11px'
                    }}
                  >
                    Selecionar imagem
                  </strong>


                  <span
                    style={{
                      marginTop:
                        '4px',

                      color:
                        '#9A8E96',

                      fontSize:
                        '9px'
                    }}
                  >
                    Escolha uma foto do trabalho realizado
                  </span>


                  <input
                    type="file"

                    accept="image/*"

                    onChange={
                      handleFileChange
                    }

                    required

                    style={{
                      display:
                        'none'
                    }}
                  />

                </label>

              </div>


              {/* PRÉVIA */}

              {imagemBase64 && (

                <div
                  style={{
                    marginBottom:
                      '18px'
                  }}
                >

                  <span
                    style={{
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
                    }}
                  >
                    Prévia
                  </span>


                  <div
                    style={{
                      height:
                        '180px',

                      overflow:
                        'hidden',

                      background:
                        '#FAF8F7',

                      border:
                        '1px solid #EBE5E0',

                      borderRadius:
                        '10px'
                    }}
                  >

                    <img
                      src={
                        imagemBase64
                      }

                      alt="Prévia"

                      style={{
                        width:
                          '100%',

                        height:
                          '100%',

                        display:
                          'block',

                        objectFit:
                          'cover'
                      }}
                    />

                  </div>

                </div>

              )}


              {/* AÇÕES */}

              <div
                style={{
                  display:
                    'flex',

                  justifyContent:
                    'flex-end',

                  gap:
                    '9px',

                  marginTop:
                    '22px',

                  paddingTop:
                    '18px',

                  borderTop:
                    '1px solid #EEE7E3'
                }}
              >

                <button
                  type="button"

                  onClick={() =>
                    setMostrarModalAdd(
                      false
                    )
                  }

                  disabled={
                    enviando
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
                    enviando
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
                      enviando
                        ? 'not-allowed'
                        : 'pointer',

                    opacity:
                      enviando
                        ? 0.65
                        : 1
                  }}
                >
                  {enviando
                    ? 'Salvando...'
                    : 'Publicar'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default Portfolio;