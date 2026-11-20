import React, { useState, useEffect } from 'react';
import AvatarPerfil from './AvatarPerfil';


function MeusPedidos({
  usuario,
  onNavigate
}) {

  const [pedidos, setPedidos] =
    useState([]);

  const [carregando, setCarregando] =
    useState(true);

  const [
    pedidoParaEditar,
    setPedidoParaEditar
  ] = useState(null);

  const [
    formEdicao,
    setFormEdicao
  ] = useState({
    descricao: '',
    prazo_desejado: ''
  });


  const idUsuario =
    usuario?.id_usuario ||
    usuario?.id;


  /* ========================================
     LÓGICA DA CAROLINA
  ======================================== */

  useEffect(() => {

    if (idUsuario) {
      carregarMeusPedidos();
    }

  }, [idUsuario]);


  const carregarMeusPedidos =
    async () => {

      try {

        const response =
          await fetch(
            '/api/pedidos'
          );


        const data =
          await response.json();


        if (Array.isArray(data)) {

          const meus =
            data.filter(
              (p) =>
                Number(
                  p.clienteId ||
                  p.id_cliente
                ) ===
                Number(idUsuario)
            );


          setPedidos(meus);

        }

      } catch (err) {

        console.error(
          'Erro ao carregar pedidos:',
          err
        );

      } finally {

        setCarregando(false);

      }

    };


  const extrairInformacoes = (
    texto,
    localizacaoPadrao
  ) => {

    if (!texto) {

      return {
        tipo:
          'Pedido de Costura',

        localizacao:
          localizacaoPadrao ||
          'Não informada',

        descricao:
          ''
      };

    }


    let tipo =
      'Pedido de Costura';

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


      const tipoExtraido =
        partes[0]
          .replace(
            /[\[\]]/g,
            ''
          )
          .replace(
            /\s*-\s*$/,
            ''
          )
          .trim();


      if (tipoExtraido) {
        tipo =
          tipoExtraido;
      }


      const resto =
        partes[1].trim();


      const quebraDupla =
        resto.indexOf(
          '\n\n'
        );


      if (
        quebraDupla !== -1
      ) {

        localizacao =
          resto
            .substring(
              0,
              quebraDupla
            )
            .trim();


        descricao =
          resto
            .substring(
              quebraDupla
            )
            .trim();

      } else {

        const primeiraLinha =
          resto.split('\n')[0];


        localizacao =
          primeiraLinha.trim();


        descricao =
          resto
            .substring(
              primeiraLinha.length
            )
            .trim();

      }

    } else {

      const matchColchetes =
        texto.match(
          /^\[([^\]]+)\]\s*(?:-?\s*)([\s\S]*)$/
        );


      if (matchColchetes) {

        tipo =
          matchColchetes[1]
            .trim();


        descricao =
          matchColchetes[2]
            .trim();

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
      return 'A combinar';
    }


    if (
      typeof dataIso === 'string' &&
      /^\d{4}-\d{2}-\d{2}/
        .test(dataIso)
    ) {

      const [
        ano,
        mes,
        dia
      ] =
        dataIso
          .split('T')[0]
          .split('-');


      return `${dia}/${mes}/${ano}`;

    }


    const data =
      new Date(dataIso);


    return isNaN(
      data.getTime()
    )
      ? 'A combinar'
      : data.toLocaleDateString(
          'pt-BR',
          {
            timeZone:
              'America/Sao_Paulo'
          }
        );

  };


  const obterEstiloStatus = (
    statusRaw
  ) => {

    const s =
      (
        statusRaw ||
        'Aberto'
      )
        .toLowerCase()
        .trim();


    if (
      s === 'aberto' ||
      s === 'disponível' ||
      s === 'disponivel'
    ) {

      return {
        background:
          '#EEF5EE',

        color:
          '#557255',

        border:
          '1px solid #D7E6D7'
      };

    }


    if (
      s === 'aguardando prova'
    ) {

      return {
        background:
          '#FFF7EA',

        color:
          '#9A7040',

        border:
          '1px solid #F0DFC0'
      };

    }


    if (
      s === 'em produção' ||
      s === 'em producao' ||
      s === 'a fazer'
    ) {

      return {
        background:
          '#EEF2F7',

        color:
          '#5C6F85',

        border:
          '1px solid #D8E0EA'
      };

    }


    if (
      s === 'concluído' ||
      s === 'concluido'
    ) {

      return {
        background:
          '#EDF6F3',

        color:
          '#52766B',

        border:
          '1px solid #D4E8E2'
      };

    }


    if (
      s === 'entregue'
    ) {

      return {
        background:
          '#F3ECEF',

        color:
          '#7A5B72',

        border:
          '1px solid #E1D4DC'
      };

    }


    if (
      s === 'cancelado'
    ) {

      return {
        background:
          '#FFF0F0',

        color:
          '#9B5D5D',

        border:
          '1px solid #F0D6D6'
      };

    }


    return {
      background:
        '#F4F1F2',

      color:
        '#746A70',

      border:
        '1px solid #E2DBDE'
    };

  };


  const handleCancelarPedido =
    async (idPedido) => {

      if (
        !window.confirm(
          'Tem certeza de que deseja cancelar este pedido?'
        )
      ) {
        return;
      }


      try {

        const response =
          await fetch(
            `/api/pedidos/${idPedido}`,
            {
              method:
                'DELETE'
            }
          );


        if (response.ok) {

          alert(
            'Pedido cancelado com sucesso!'
          );


          carregarMeusPedidos();

        } else {

          const data =
            await response.json();


          alert(
            data.erro ||
            'Erro ao cancelar o pedido.'
          );

        }

      } catch (err) {

        alert(
          `Erro de conexão: ${err.message}`
        );

      }

    };


  const handleAbrirEdicao = (
    pedido
  ) => {

    const info =
      extrairInformacoes(
        pedido.descricao,
        pedido.localizacao
      );


    const prazoRaw =
      pedido.prazoDesejado ||
      pedido.prazo_desejado;


    const prazoFormatado =
      prazoRaw
        ? (
            typeof prazoRaw === 'string' &&
            /^\d{4}-\d{2}-\d{2}/
              .test(prazoRaw)

              ? prazoRaw
                  .split('T')[0]

              : new Date(
                  prazoRaw
                )
                  .toISOString()
                  .split('T')[0]
          )
        : '';


    setPedidoParaEditar({
      ...pedido,
      infoExtraida:
        info
    });


    setFormEdicao({
      descricao:
        info.descricao ||
        pedido.descricao ||
        '',

      prazo_desejado:
        prazoFormatado
    });

  };


  const handleSalvarEdicao =
    async (e) => {

      e.preventDefault();


      if (!pedidoParaEditar) {
        return;
      }


      const info =
        pedidoParaEditar
          .infoExtraida;


      const descricaoCompleta =
        info &&
        info.localizacao &&
        info.localizacao !==
          'Não informada'

          ? `[${info.tipo}] - Localização: ${info.localizacao}\n\n${formEdicao.descricao.trim()}`

          : formEdicao.descricao
              .trim();


      try {

        const response =
          await fetch(
            `/api/pedidos/${
              pedidoParaEditar.id ||
              pedidoParaEditar.id_pedido
            }`,
            {
              method:
                'PUT',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  id_cliente:
                    idUsuario,

                  descricao:
                    descricaoCompleta,

                  prazo_desejado:
                    formEdicao.prazo_desejado
                })
            }
          );


        if (response.ok) {

          alert(
            'Pedido atualizado com sucesso!'
          );


          setPedidoParaEditar(
            null
          );


          carregarMeusPedidos();

        } else {

          const data =
            await response.json();


          alert(
            data.erro ||
            'Erro ao atualizar pedido.'
          );

        }

      } catch (err) {

        alert(
          `Erro ao atualizar pedido: ${err.message}`
        );

      }

    };


  /* ========================================
     VISUAL
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
            Área do cliente
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
            Meus pedidos
          </h1>


          <p
            style={{
              margin:
                '8px 0 0',

              color:
                '#857885',

              fontSize:
                '12px',

              lineHeight:
                '1.6'
            }}
          >
            Olá,{' '}
            <strong
              style={{
                color:
                  '#6E5568'
              }}
            >
              {usuario?.nome ||
               'Cliente'}
            </strong>
            . Acompanhe suas solicitações,
            prazos e negociações.
          </p>

        </div>


        <div
          style={{
            display:
              'flex',

            alignItems:
              'center',

            gap:
              '9px',

            flexWrap:
              'wrap'
          }}
        >

          <button
            type="button"

            onClick={() =>
              onNavigate &&
              onNavigate(
                'meusChats'
              )
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
            Minhas Conversas
          </button>


          <button
            type="button"

            onClick={() =>
              onNavigate &&
              onNavigate(
                'publicarPedido'
              )
            }

            style={{
              height:
                '40px',

              padding:
                '0 16px',

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
            + Novo Pedido
          </button>


          <AvatarPerfil
            usuario={
              usuario
            }

            onClick={() =>
              onNavigate &&
              onNavigate(
                'perfil'
              )
            }
          />

        </div>

      </section>


      {/* RESUMO */}

      {!carregando &&
       pedidos.length > 0 && (

        <div
          style={{
            display:
              'flex',

            justifyContent:
              'flex-end',

            marginBottom:
              '14px'
          }}
        >

          <div
            style={{
              padding:
                '7px 12px',

              background:
                '#F3ECEF',

              border:
                '1px solid #E4D9E0',

              borderRadius:
                '9px',

              color:
                '#7A5B72',

              fontSize:
                '9px'
            }}
          >
            <strong>
              {pedidos.length}
            </strong>{' '}
            {pedidos.length === 1
              ? 'pedido'
              : 'pedidos'}
          </div>

        </div>

      )}


      {/* CARREGANDO */}

      {carregando ? (

        <div
          style={{
            padding:
              '50px',

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
          Carregando seus pedidos...
        </div>

      ) : pedidos.length === 0 ? (


        /* VAZIO */

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
                '46px',

              height:
                '46px',

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
                '19px'
            }}
          >
            ✂
          </div>


          <h2
            style={{
              margin:
                '0 0 6px',

              color:
                '#3E2445',

              fontFamily:
                "'Playfair Display', Georgia, serif",

              fontSize:
                '19px'
            }}
          >
            Nenhum pedido publicado
          </h2>


          <p
            style={{
              margin:
                '0 0 17px',

              color:
                '#91858E',

              fontSize:
                '11px',

              lineHeight:
                '1.6'
            }}
          >
            Você ainda não publicou nenhum pedido.
          </p>


          <button
            type="button"

            onClick={() =>
              onNavigate &&
              onNavigate(
                'publicarPedido'
              )
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
            + Novo Pedido
          </button>

        </div>

      ) : (


        /* LISTA */

        <div
          style={{
            display:
              'flex',

            flexDirection:
              'column',

            gap:
              '16px'
          }}
        >

          {pedidos.map(
            (pedido) => {

              const statusAtual =
                pedido.status ||
                pedido.status_pedido ||
                'Aberto';


              const isAberto =
                statusAtual
                  .toLowerCase() ===
                'aberto';


              const info =
                extrairInformacoes(
                  pedido.descricao,
                  pedido.localizacao
                );


              const estiloStatus =
                obterEstiloStatus(
                  statusAtual
                );


              return (

                <article
                  key={
                    pedido.id ||
                    pedido.id_pedido
                  }

                  style={{
                    overflow:
                      'hidden',

                    display:
                      'flex',

                    alignItems:
                      'stretch',

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

                  {pedido.fotoReferencia && (

                    <div
                      style={{
                        width:
                          '180px',

                        minHeight:
                          '190px',

                        flexShrink:
                          0,

                        overflow:
                          'hidden',

                        background:
                          '#FAF8F7',

                        borderRight:
                          '1px solid #EEE7E3'
                      }}
                    >

                      <img
                        src={
                          pedido.fotoReferencia
                        }

                        alt="Referência"

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

                  )}


                  {/* CONTEÚDO */}

                  <div
                    style={{
                      flex:
                        1,

                      minWidth:
                        0,

                      padding:
                        '20px 22px'
                    }}
                  >


                    {/* TOPO */}

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
                          '13px',

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
                          Pedido de costura
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
                          {info.tipo}
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

                          flexWrap:
                            'wrap'
                        }}
                      >

                        <span
                          style={{
                            padding:
                              '5px 9px',

                            borderRadius:
                              '999px',

                            fontSize:
                              '8px',

                            fontWeight:
                              '700',

                            textTransform:
                              'uppercase',

                            letterSpacing:
                              '0.2px',

                            ...estiloStatus
                          }}
                        >
                          {statusAtual}
                        </span>


                        <span
                          style={{
                            color:
                              '#A0949C',

                            fontSize:
                              '9px'
                          }}
                        >
                          {formatarData(
                            pedido.dataPublicacao ||
                            pedido.data_publicacao
                          )}
                        </span>

                      </div>

                    </div>


                    {/* DESCRIÇÃO */}

                    {info.descricao && (

                      <p
                        style={{
                          margin:
                            '0 0 15px',

                          color:
                            '#625962',

                          fontSize:
                            '11px',

                          lineHeight:
                            '1.7',

                          whiteSpace:
                            'pre-line'
                        }}
                      >
                        {info.descricao}
                      </p>

                    )}


                    {/* INFORMAÇÕES */}

                    <div
                      style={{
                        display:
                          'grid',

                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(180px, 1fr))',

                        gap:
                          '8px',

                        marginBottom:
                          '16px'
                      }}
                    >

                      <div
                        style={{
                          padding:
                            '10px 12px',

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
                              '600'
                          }}
                        >
                          {info.localizacao}
                        </strong>

                      </div>


                      <div
                        style={{
                          padding:
                            '10px 12px',

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
                          Prazo desejado
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
                          {formatarData(
                            pedido.prazoDesejado ||
                            pedido.prazo_desejado
                          )}
                        </strong>

                      </div>

                    </div>


                    {/* AÇÕES */}

                    <div
                      style={{
                        display:
                          'flex',

                        gap:
                          '8px',

                        paddingTop:
                          '14px',

                        borderTop:
                          '1px solid #F0EAE7',

                        flexWrap:
                          'wrap'
                      }}
                    >


                      {!isAberto && (

                        <button
                          type="button"

                          onClick={() =>
                            onNavigate &&
                            onNavigate(
                              'chat',
                              pedido
                            )
                          }

                          style={{
                            padding:
                              '9px 14px',

                            background:
                              '#7A5B72',

                            color:
                              '#FFFFFF',

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
                          Abrir Chat de Negociação
                        </button>

                      )}


                      {isAberto && (

                        <>

                          <button
                            type="button"

                            onClick={() =>
                              handleAbrirEdicao(
                                pedido
                              )
                            }

                            style={{
                              padding:
                                '9px 14px',

                              background:
                                '#F3ECEF',

                              color:
                                '#6E5568',

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
                            Editar Pedido
                          </button>


                          <button
                            type="button"

                            onClick={() =>
                              handleCancelarPedido(
                                pedido.id ||
                                pedido.id_pedido
                              )
                            }

                            style={{
                              padding:
                                '9px 14px',

                              background:
                                '#FFF7F7',

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
                            Cancelar Pedido
                          </button>

                        </>

                      )}

                    </div>

                  </div>

                </article>

              );

            }
          )}

        </div>

      )}


      {/* =====================================
          MODAL DE EDIÇÃO
      ====================================== */}

      {pedidoParaEditar && (

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

              padding:
                '24px',

              boxSizing:
                'border-box',

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
              Pedido
            </span>


            <h2
              style={{
                margin:
                  '0 0 20px',

                color:
                  '#3E2445',

                fontFamily:
                  "'Playfair Display', Georgia, serif",

                fontSize:
                  '22px'
              }}
            >
              Editar Pedido
            </h2>


            <form
              onSubmit={
                handleSalvarEdicao
              }
            >


              <div
                style={{
                  marginBottom:
                    '16px'
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
                  Descrição do Pedido
                </label>


                <textarea
                  rows="5"

                  value={
                    formEdicao.descricao
                  }

                  onChange={(e) =>
                    setFormEdicao({
                      ...formEdicao,
                      descricao:
                        e.target.value
                    })
                  }

                  required

                  style={{
                    width:
                      '100%',

                    minHeight:
                      '120px',

                    padding:
                      '11px 12px',

                    boxSizing:
                      'border-box',

                    resize:
                      'vertical',

                    background:
                      '#FFFFFF',

                    color:
                      '#4A424A',

                    border:
                      '1px solid #DED6D1',

                    borderRadius:
                      '8px',

                    outline:
                      'none',

                    fontFamily:
                      "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

                    fontSize:
                      '11px',

                    lineHeight:
                      '1.6'
                  }}
                />

              </div>


              <div
                style={{
                  marginBottom:
                    '20px'
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
                  Prazo Desejado
                </label>


                <input
                  type="date"

                  value={
                    formEdicao.prazo_desejado
                  }

                  onChange={(e) =>
                    setFormEdicao({
                      ...formEdicao,
                      prazo_desejado:
                        e.target.value
                    })
                  }

                  required

                  style={{
                    width:
                      '100%',

                    height:
                      '42px',

                    padding:
                      '0 12px',

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

                    outline:
                      'none',

                    fontSize:
                      '11px'
                  }}
                />

              </div>


              <div
                style={{
                  display:
                    'flex',

                  justifyContent:
                    'flex-end',

                  gap:
                    '9px',

                  paddingTop:
                    '18px',

                  borderTop:
                    '1px solid #EEE7E3'
                }}
              >

                <button
                  type="button"

                  onClick={() =>
                    setPedidoParaEditar(
                      null
                    )
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
                  Salvar Alterações
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default MeusPedidos;