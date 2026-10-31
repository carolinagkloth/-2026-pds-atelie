import React, { useState, useEffect } from 'react';

function FeedPedidos({
  usuario,
  usuarioLogado,
  onNavigate,
  onDemonstrarInteresse
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


  const usuarioAtual =
    usuario ||
    usuarioLogado ||
    usuarioSalvo;


  const isCostureira =
    (
      usuarioAtual?.tipo_usuario ||
      usuarioAtual?.tipoUsuario ||
      ''
    )
      .toString()
      .toLowerCase() ===
    'costureira';


  const [
    pedidos,
    setPedidos
  ] = useState([]);


  const [
    carregando,
    setCarregando
  ] = useState(true);


  const [
    erro,
    setErro
  ] = useState('');


  const [
    filtroServico,
    setFiltroServico
  ] = useState('Todos');


  const [
    buscaLocalizacao,
    setBuscaLocalizacao
  ] = useState('');


  useEffect(() => {

    fetch('/api/pedidos')

      .then((res) => {

        if (!res.ok) {

          throw new Error(
            'Erro ao carregar o mural de pedidos.'
          );

        }

        return res.json();

      })

      .then((data) => {

        if (Array.isArray(data)) {

          setPedidos(data);

        } else {

          setPedidos([]);

        }

      })

      .catch((err) => {

        setErro(
          err.message
        );

      })

      .finally(() => {

        setCarregando(
          false
        );

      });

  }, []);


  const extrairInformacoes = (
    texto,
    localizacaoPadrao
  ) => {

    if (!texto) {

      return {
        tipo:
          'Ajuste / Conserto',

        localizacao:
          localizacaoPadrao ||
          'Não informada',

        descricao:
          ''
      };

    }


    let tipo =
      'Ajuste / Conserto';


    let localizacao =
      localizacaoPadrao ||
      'Não informada';


    let descricao =
      texto;


    if (
      texto.includes(
        'Localização:'
      )
    ) {

      const partes =
        texto.split(
          'Localização:'
        );


      let tipoExtraido =
        partes[0]
          .replace('[', '')
          .replace(']', '')
          .replace('-', '')
          .trim();


      if (tipoExtraido) {

        tipo =
          tipoExtraido;

      }


      const resto =
        partes[1].trim();


      const quebra =
        resto.indexOf(
          '\n'
        );


      if (
        quebra !== -1
      ) {

        localizacao =
          resto
            .substring(
              0,
              quebra
            )
            .trim();


        descricao =
          resto
            .substring(
              quebra
            )
            .trim();

      } else {

        localizacao =
          resto;

        descricao =
          resto;

      }

    }


    return {
      tipo,
      localizacao,
      descricao
    };

  };


  const formatarData = (
    dataIso
  ) => {

    if (!dataIso) {

      return '-';

    }


    const data =
      new Date(
        dataIso
      );


    return data
      .toLocaleDateString(
        'pt-BR'
      );

  };


  const handleInteresse = (
    pedido
  ) => {

    if (
      onDemonstrarInteresse
    ) {

      onDemonstrarInteresse(
        pedido
      );

    } else if (
      onNavigate
    ) {

      onNavigate(
        'chat',
        pedido
      );

    }

  };


  const listaPedidos =
    Array.isArray(
      pedidos
    )
      ? pedidos
      : [];


  const pedidosFiltrados =
    listaPedidos.filter(
      (pedido) => {

        const info =
          extrairInformacoes(
            pedido.descricao,
            pedido.localizacao
          );


        const statusAberto =
          pedido.status ===
            'Aberto' ||

          pedido.status ===
            'Disponível' ||

          !pedido.status;


        const atendeServico =
          filtroServico ===
            'Todos' ||

          info.tipo
            .toLowerCase()
            .includes(
              filtroServico
                .toLowerCase()
            );


        const atendeLocal =
          (
            info.localizacao ||
            ''
          )
            .toLowerCase()
            .includes(
              (
                buscaLocalizacao ||
                ''
              )
                .toLowerCase()
            );


        return (
          statusAberto &&
          atendeServico &&
          atendeLocal
        );

      }
    );


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
            '25px',

          marginBottom:
            '25px'
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
            Área da costureira
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
            Pedidos disponíveis
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

            {
              usuarioAtual?.nome
                ? `Olá, ${usuarioAtual.nome}. Encontre solicitações compatíveis com seus serviços e converse com os clientes.`
                : 'Encontre solicitações compatíveis com seus serviços e converse com os clientes.'
            }

          </p>

        </div>


        <div
          style={{
            flexShrink:
              0,

            padding:
              '10px 14px',

            background:
              '#F3ECEF',

            border:
              '1px solid #E4D9E0',

            borderRadius:
              '9px',

            textAlign:
              'center'
          }}
        >

          <span
            style={{
              display:
                'block',

              color:
                '#917687',

              fontSize:
                '8px',

              fontWeight:
                '700',

              letterSpacing:
                '0.8px',

              textTransform:
                'uppercase'
            }}
          >
            Disponíveis
          </span>


          <strong
            style={{
              display:
                'block',

              marginTop:
                '2px',

              color:
                '#3E2445',

              fontFamily:
                "'Playfair Display', Georgia, serif",

              fontSize:
                '21px'
            }}
          >
            {
              pedidosFiltrados.length
            }
          </strong>

        </div>

      </section>



      {/* FILTROS */}

      <section
        style={{
          marginBottom:
            '25px',

          padding:
            '20px',

          background:
            '#FFFFFF',

          border:
            '1px solid #EBE5E0',

          borderRadius:
            '13px',

          boxShadow:
            '0 7px 20px rgba(62,36,69,0.04)'
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
              '15px',

            marginBottom:
              '15px'
          }}
        >

          <div>

            <span
              style={{
                display:
                  'block',

                marginBottom:
                  '3px',

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
              Busca
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
                  '18px'
              }}
            >
              Encontrar pedidos
            </h2>

          </div>


          {
            (
              filtroServico !==
                'Todos' ||

              buscaLocalizacao
            ) &&
            (

              <button
                type="button"
                onClick={() => {

                  setFiltroServico(
                    'Todos'
                  );

                  setBuscaLocalizacao(
                    ''
                  );

                }}
                style={{
                  padding:
                    '7px 11px',

                  background:
                    'transparent',

                  color:
                    '#7A5B72',

                  border:
                    '1px solid #D8CFD5',

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
                Limpar filtros
              </button>

            )
          }

        </div>



        <div
          style={{
            display:
              'grid',

            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',

            gap:
              '15px'
          }}
        >


          <div>

            <label
              style={{
                display:
                  'block',

                marginBottom:
                  '6px',

                color:
                  '#625762',

                fontSize:
                  '10px',

                fontWeight:
                  '700'
              }}
            >
              Tipo de serviço
            </label>


            <select
              value={
                filtroServico
              }
              onChange={
                (e) =>
                  setFiltroServico(
                    e.target.value
                  )
              }
              style={{
                width:
                  '100%',

                padding:
                  '10px 12px',

                background:
                  '#FAF8F7',

                color:
                  '#4A424A',

                border:
                  '1px solid #DED6D1',

                borderRadius:
                  '8px',

                boxSizing:
                  'border-box',

                outline:
                  'none',

                fontSize:
                  '11px',

                cursor:
                  'pointer'
              }}
            >

              <option value="Todos">
                Todos os serviços
              </option>

              <option value="Ajuste">
                Ajuste / Conserto
              </option>

              <option value="Confecção sob Medida">
                Confecção sob Medida
              </option>

              <option value="Customização">
                Customização / Bordado
              </option>

              <option value="Vestido de Festa">
                Vestido de Festa
              </option>

            </select>

          </div>



          <div>

            <label
              style={{
                display:
                  'block',

                marginBottom:
                  '6px',

                color:
                  '#625762',

                fontSize:
                  '10px',

                fontWeight:
                  '700'
              }}
            >
              Bairro ou cidade
            </label>


            <input
              type="text"
              placeholder="Ex.: Centro, Ponta Grossa..."
              value={
                buscaLocalizacao
              }
              onChange={
                (e) =>
                  setBuscaLocalizacao(
                    e.target.value
                  )
              }
              style={{
                width:
                  '100%',

                padding:
                  '10px 12px',

                background:
                  '#FAF8F7',

                color:
                  '#4A424A',

                border:
                  '1px solid #DED6D1',

                borderRadius:
                  '8px',

                boxSizing:
                  'border-box',

                outline:
                  'none',

                fontSize:
                  '11px'
              }}
            />

          </div>

        </div>

      </section>



      {/* CARREGAMENTO */}

      {
        carregando &&
        (

          <div
            style={{
              padding:
                '45px',

              background:
                '#FFFFFF',

              border:
                '1px solid #EBE5E0',

              borderRadius:
                '13px',

              textAlign:
                'center',

              color:
                '#857885',

              fontSize:
                '12px'
            }}
          >
            Carregando pedidos do mural...
          </div>

        )
      }



      {/* ERRO */}

      {
        erro &&
        (

          <div
            style={{
              marginBottom:
                '15px',

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

        )
      }



      {/* SEM RESULTADOS */}

      {
        !carregando &&
        pedidosFiltrados.length === 0
          ? (

            <div
              style={{
                padding:
                  '55px 25px',

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
                    '44px',

                  height:
                    '44px',

                  margin:
                    '0 auto 12px',

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
                    '0 0 6px',

                  color:
                    '#3E2445',

                  fontFamily:
                    "'Playfair Display', Georgia, serif",

                  fontSize:
                    '18px'
                }}
              >
                Nenhum pedido encontrado
              </h3>


              <p
                style={{
                  maxWidth:
                    '450px',

                  margin:
                    '0 auto',

                  color:
                    '#91858E',

                  fontSize:
                    '11px',

                  lineHeight:
                    '1.6'
                }}
              >
                Tente alterar os filtros ou aguarde
                novas solicitações publicadas pelos clientes.
              </p>

            </div>

          )
          : (

            /* GRID DE PEDIDOS */

            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(auto-fit, minmax(350px, 1fr))',

                gap:
                  '18px'
              }}
            >

              {
                pedidosFiltrados.map(
                  (pedido) => {

                    const info =
                      extrairInformacoes(
                        pedido.descricao,
                        pedido.localizacao
                      );


                    return (

                      <article
                        key={
                          pedido.id
                        }
                        style={{
                          overflow:
                            'hidden',

                          display:
                            'flex',

                          flexDirection:
                            'column',

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


                        {/* IMAGEM */}

                        {
                          pedido.fotoReferencia
                            ? (

                              <div
                                style={{
                                  width:
                                    '100%',

                                  height:
                                    '190px',

                                  overflow:
                                    'hidden',

                                  background:
                                    '#FAF8F7',

                                  borderBottom:
                                    '1px solid #EEE7E3'
                                }}
                              >

                                <img
                                  src={
                                    pedido.fotoReferencia
                                  }
                                  alt="Referência da peça"
                                  style={{
                                    width:
                                      '100%',

                                    height:
                                      '100%',

                                    objectFit:
                                      'cover',

                                    display:
                                      'block'
                                  }}
                                />

                              </div>

                            )
                            : (

                              <div
                                style={{
                                  height:
                                    '95px',

                                  display:
                                    'flex',

                                  alignItems:
                                    'center',

                                  justifyContent:
                                    'center',

                                  background:
                                    '#FAF8F7',

                                  color:
                                    '#C2B4BD',

                                  borderBottom:
                                    '1px solid #EEE7E3',

                                  fontSize:
                                    '24px'
                                }}
                              >
                                ✂
                              </div>

                            )
                        }



                        {/* CONTEÚDO */}

                        <div
                          style={{
                            flex:
                              1,

                            display:
                              'flex',

                            flexDirection:
                              'column',

                            padding:
                              '20px'
                          }}
                        >


                          {/* TAG + DATA */}

                          <div
                            style={{
                              display:
                                'flex',

                              justifyContent:
                                'space-between',

                              alignItems:
                                'center',

                              gap:
                                '10px',

                              marginBottom:
                                '12px'
                            }}
                          >

                            <span
                              style={{
                                padding:
                                  '5px 9px',

                                background:
                                  '#F3ECEF',

                                color:
                                  '#6E5568',

                                borderRadius:
                                  '999px',

                                fontSize:
                                  '8px',

                                fontWeight:
                                  '700',

                                letterSpacing:
                                  '0.3px',

                                textTransform:
                                  'uppercase'
                              }}
                            >
                              {
                                info.tipo
                              }
                            </span>


                            <span
                              style={{
                                color:
                                  '#A0949C',

                                fontSize:
                                  '9px'
                              }}
                            >
                              {
                                formatarData(
                                  pedido.dataPublicacao
                                )
                              }
                            </span>

                          </div>



                          {/* CLIENTE */}

                          <span
                            style={{
                              display:
                                'block',

                              marginBottom:
                                '3px',

                              color:
                                '#A0949C',

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
                            Solicitação de cliente
                          </span>


                          <h3
                            style={{
                              margin:
                                '0 0 10px',

                              color:
                                '#3E2445',

                              fontFamily:
                                "'Playfair Display', Georgia, serif",

                              fontSize:
                                '18px',

                              lineHeight:
                                '1.25'
                            }}
                          >
                            {
                              pedido.clienteNome ||
                              'Cliente'
                            }
                          </h3>



                          {/* DESCRIÇÃO */}

                          <p
                            style={{
                              flex:
                                1,

                              margin:
                                '0 0 16px',

                              color:
                                '#625962',

                              fontSize:
                                '11px',

                              lineHeight:
                                '1.6',

                              whiteSpace:
                                'pre-line'
                            }}
                          >
                            {
                              info.descricao ||
                              'O cliente não adicionou uma descrição.'
                            }
                          </p>



                          {/* INFORMAÇÕES */}

                          <div
                            style={{
                              display:
                                'grid',

                              gridTemplateColumns:
                                '1fr 1fr',

                              gap:
                                '8px',

                              marginBottom:
                                '16px'
                            }}
                          >


                            <div
                              style={{
                                padding:
                                  '10px',

                                background:
                                  '#FAF8F7',

                                borderRadius:
                                  '8px'
                              }}
                            >

                              <span
                                style={{
                                  display:
                                    'block',

                                  marginBottom:
                                    '3px',

                                  color:
                                    '#A0949C',

                                  fontSize:
                                    '8px',

                                  fontWeight:
                                    '700',

                                  textTransform:
                                    'uppercase'
                                }}
                              >
                                Localização
                              </span>


                              <strong
                                style={{
                                  color:
                                    '#554C54',

                                  fontSize:
                                    '10px',

                                  fontWeight:
                                    '600',

                                  lineHeight:
                                    '1.4'
                                }}
                              >
                                {
                                  info.localizacao
                                }
                              </strong>

                            </div>



                            <div
                              style={{
                                padding:
                                  '10px',

                                background:
                                  '#FAF8F7',

                                borderRadius:
                                  '8px'
                              }}
                            >

                              <span
                                style={{
                                  display:
                                    'block',

                                  marginBottom:
                                    '3px',

                                  color:
                                    '#A0949C',

                                  fontSize:
                                    '8px',

                                  fontWeight:
                                    '700',

                                  textTransform:
                                    'uppercase'
                                }}
                              >
                                Prazo
                              </span>


                              <strong
                                style={{
                                  color:
                                    '#554C54',

                                  fontSize:
                                    '10px',

                                  fontWeight:
                                    '600'
                                }}
                              >
                                {
                                  formatarData(
                                    pedido.prazoDesejado
                                  )
                                }
                              </strong>

                            </div>

                          </div>



                          {/* AÇÃO */}

                          {
                            isCostureira
                              ? (

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleInteresse(
                                      pedido
                                    )
                                  }
                                  style={{
                                    width:
                                      '100%',

                                    padding:
                                      '10px 14px',

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
                                      'pointer',

                                    boxShadow:
                                      '0 5px 14px rgba(62,36,69,0.10)'
                                  }}
                                >
                                  Demonstrar interesse
                                </button>

                              )
                              : (

                                <div
                                  style={{
                                    padding:
                                      '9px',

                                    background:
                                      '#FAF8F7',

                                    color:
                                      '#91858E',

                                    borderRadius:
                                      '7px',

                                    fontSize:
                                      '9px',

                                    fontStyle:
                                      'italic',

                                    textAlign:
                                      'center'
                                  }}
                                >
                                  Apenas contas de Costureira
                                  podem aceitar solicitações.
                                </div>

                              )
                          }

                        </div>

                      </article>

                    );

                  }
                )
              }

            </div>

          )
      }

    </div>

  );

}

export default FeedPedidos;