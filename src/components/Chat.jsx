import React, { useState } from 'react';

function Chat({ usuario, usuarioLogado, onNavigate, pedido }) {

  // Leitura segura do usuário logado
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
    usuario ||
    usuarioLogado ||
    usuarioSalvo;

  const tipoPerfilRaw = (
    user?.tipo_usuario ||
    user?.tipoUsuario ||
    user?.usuario?.tipo_usuario ||
    'Cliente'
  ).toString();

  const isCostureira =
    tipoPerfilRaw.toLowerCase() === 'costureira';

  const papelAtual =
    isCostureira
      ? 'Costureira'
      : 'Cliente';

  const nomeUsuario =
    user?.nome ||
    user?.usuario?.nome ||
    papelAtual;


  // Ficha de medidas
  const [medidas, setMedidas] = useState({
    clienteNome:
      pedido?.clienteNome ||
      (
        isCostureira
          ? 'Cliente'
          : nomeUsuario
      ),
    busto: '',
    cintura: '',
    quadril: '',
    altura: '',
    comprimentoDesejado: ''
  });

  const [
    editandoMedidas,
    setEditandoMedidas
  ] = useState(false);


  // Mensagens
  const [
    mensagens,
    setMensagens
  ] = useState([]);

  const [
    novaMensagem,
    setNovaMensagem
  ] = useState('');


  // Orçamento
  const [
    mostrarModalOrcamento,
    setMostrarModalOrcamento
  ] = useState(false);

  const [
    orcamento,
    setOrcamento
  ] = useState(null);

  const [
    statusPagamento,
    setStatusPagamento
  ] = useState('Sem Orçamento');


  const [
    formOrcamento,
    setFormOrcamento
  ] = useState({
    descricao:
      pedido?.descricao
        ? `Serviço: ${pedido.descricao}`
        : '',
    valor: '',
    prazo:
      pedido?.prazoDesejado ||
      ''
  });


  const handleVoltarPedidos = () => {
    if (onNavigate) {
      onNavigate(
        isCostureira
          ? 'feedPedidos'
          : 'meusPedidos'
      );
    }
  };


  const handleEnviarMensagem = (e) => {

    e.preventDefault();

    if (!novaMensagem.trim()) {
      return;
    }

    const msg = {
      id: Date.now(),
      remetente: papelAtual,
      nomeRemetente: nomeUsuario,
      texto: novaMensagem,
      hora:
        new Date()
          .toLocaleTimeString(
            [],
            {
              hour: '2-digit',
              minute: '2-digit'
            }
          ),
      tipo: 'texto'
    };

    setMensagens(
      (prev) => [
        ...prev,
        msg
      ]
    );

    setNovaMensagem('');
  };


  const handleAbrirModalOrcamento = () => {

    if (orcamento) {

      setFormOrcamento({
        descricao:
          orcamento.descricao,
        valor:
          orcamento.valor,
        prazo:
          orcamento.prazo
      });

    }

    setMostrarModalOrcamento(true);
  };


  const handleSalvarOrcamento = (e) => {

    e.preventDefault();

    const valor =
      parseFloat(
        formOrcamento.valor
      );

    const sinal =
      valor * 0.5;

    const prazo =
      formOrcamento.prazo;

    const descricao =
      formOrcamento.descricao;


    if (!valor || valor <= 0) {

      alert(
        'Informe um valor válido para o orçamento.'
      );

      return;
    }


    const eEdicao =
      !!orcamento;


    const novoOrcamento = {
      id: Date.now(),
      valor,
      sinal,
      prazo,
      descricao,
      aprovado: false
    };


    setOrcamento(
      novoOrcamento
    );

    setStatusPagamento(
      'Aguardando Aprovação'
    );

    setMostrarModalOrcamento(
      false
    );


    setMensagens(
      (prev) => [
        ...prev,
        {
          id: Date.now(),

          remetente:
            'Costureira',

          nomeRemetente:
            nomeUsuario,

          texto:
            `PROPOSTA DE ORÇAMENTO ${
              eEdicao
                ? 'ATUALIZADA'
                : 'EMITIDA'
            }:
Serviço: ${descricao}
Valor Total: R$ ${valor.toFixed(2)}
Sinal (50%): R$ ${sinal.toFixed(2)}
Prazo Estimado: ${prazo}`,

          hora:
            new Date()
              .toLocaleTimeString(
                [],
                {
                  hour: '2-digit',
                  minute: '2-digit'
                }
              ),

          tipo:
            'orcamento',

          dadosOrcamento:
            novoOrcamento
        }
      ]
    );
  };


  const handleAprovarOrcamento = () => {

    setOrcamento(
      (prev) => ({
        ...prev,
        aprovado: true
      })
    );

    setStatusPagamento(
      'Sinal Pago (50%)'
    );


    setMensagens(
      (prev) => [
        ...prev,
        {
          id: Date.now(),

          remetente:
            'Cliente',

          nomeRemetente:
            nomeUsuario,

          texto:
            'Orçamento aprovado! Pagamento do sinal confirmado.',

          hora:
            new Date()
              .toLocaleTimeString(
                [],
                {
                  hour: '2-digit',
                  minute: '2-digit'
                }
              ),

          tipo:
            'sistema'
        }
      ]
    );
  };


  const handleSalvarMedidas = (e) => {

    e.preventDefault();

    setEditandoMedidas(
      false
    );
  };


  const handleExportarTXT = () => {

    const conteudo =
`=== ATELIÊ ENTRE LINHAS - FICHA DE MEDIDAS ===
Cliente: ${medidas.clienteNome}
Busto: ${medidas.busto || 'Não informado'}
Cintura: ${medidas.cintura || 'Não informado'}
Quadril: ${medidas.quadril || 'Não informado'}
Altura: ${medidas.altura || 'Não informado'}
Comprimento Desejado: ${medidas.comprimentoDesejado || 'Não informado'}
Data de Emissão: ${new Date().toLocaleDateString()}`;


    const element =
      document.createElement('a');

    const file =
      new Blob(
        [conteudo],
        {
          type:
            'text/plain;charset=utf-8'
        }
      );


    element.href =
      URL.createObjectURL(
        file
      );


    element.download =
      `Ficha_Medidas_${
        medidas.clienteNome
          .replace(
            /\s+/g,
            '_'
          )
      }.txt`;


    document.body.appendChild(
      element
    );

    element.click();

    document.body.removeChild(
      element
    );
  };


  const handleExportarPDFMedidas = () => {

    const janelaImpressao =
      window.open(
        '',
        '_blank'
      );


    janelaImpressao.document.write(
      `
      <html>

        <head>

          <title>
            Ficha de Medidas - ${medidas.clienteNome}
          </title>

          <style>

            body {
              font-family: sans-serif;
              padding: 30px;
              color: #333;
            }

            h1 {
              color: #3E2445;
              border-bottom: 2px solid #3E2445;
              padding-bottom: 8px;
              margin-bottom: 5px;
            }

            h2 {
              color: #7A5B72;
              font-size: 18px;
              margin-top: 0;
            }

            ul {
              line-height: 2;
              font-size: 15px;
              list-style-type: square;
            }

            .footer {
              margin-top: 50px;
              font-size: 12px;
              color: #777;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }

          </style>

        </head>


        <body>

          <h1>
            Ateliê Entre Linhas
          </h1>

          <h2>
            Ficha Corporal de Medidas
          </h2>


          <p>
            <strong>Cliente:</strong>
            ${medidas.clienteNome}
          </p>


          <p>
            <strong>Data de Emissão:</strong>
            ${new Date().toLocaleDateString()}
          </p>


          <hr />


          <ul>

            <li>
              <strong>Busto:</strong>
              ${medidas.busto || 'Não preenchido'}
            </li>

            <li>
              <strong>Cintura:</strong>
              ${medidas.cintura || 'Não preenchido'}
            </li>

            <li>
              <strong>Quadril:</strong>
              ${medidas.quadril || 'Não preenchido'}
            </li>

            <li>
              <strong>Altura:</strong>
              ${medidas.altura || 'Não preenchido'}
            </li>

            <li>
              <strong>Comprimento Desejado:</strong>
              ${
                medidas.comprimentoDesejado ||
                'Não preenchido'
              }
            </li>

          </ul>


          <div class="footer">
            Gerado por Ateliê Entre Linhas
          </div>


          <script>

            window.onload = function() {
              window.print();
              window.close();
            }

          </script>

        </body>

      </html>
      `
    );


    janelaImpressao.document.close();
  };


  const handleExportarPDFOrcamento = () => {

    if (!orcamento) {
      return;
    }


    const janelaImpressao =
      window.open(
        '',
        '_blank'
      );


    janelaImpressao.document.write(
      `
      <html>

        <head>

          <title>
            Orçamento - Ateliê Entre Linhas
          </title>


          <style>

            body {
              font-family: sans-serif;
              padding: 30px;
              color: #333;
            }

            h1 {
              color: #3E2445;
              border-bottom: 2px solid #3E2445;
              padding-bottom: 8px;
            }

            .box {
              background: #faf7f5;
              padding: 20px;
              border-radius: 6px;
              border: 1px solid #ddd;
              margin-top: 15px;
            }

            .price {
              font-size: 20px;
              color: #2e7d32;
              font-weight: bold;
            }

            .footer {
              margin-top: 50px;
              font-size: 12px;
              color: #777;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }

          </style>

        </head>


        <body>

          <h1>
            Ateliê Entre Linhas
          </h1>


          <h2>
            Comprovante de Proposta de Orçamento
          </h2>


          <p>
            <strong>Cliente:</strong>
            ${medidas.clienteNome}
          </p>


          <p>
            <strong>Data de Emissão:</strong>
            ${new Date().toLocaleDateString()}
          </p>


          <div class="box">

            <p>
              <strong>Descrição do Serviço:</strong>
              ${orcamento.descricao}
            </p>

            <p class="price">
              Valor Total:
              R$ ${orcamento.valor.toFixed(2)}
            </p>

            <p>
              <strong>Sinal Obrigatório (50%):</strong>
              R$ ${orcamento.sinal.toFixed(2)}
            </p>

            <p>
              <strong>Prazo Estimado:</strong>
              ${orcamento.prazo}
            </p>

            <p>
              <strong>Status:</strong>
              ${
                orcamento.aprovado
                  ? 'Aprovado pelo Cliente'
                  : 'Aguardando Aprovação'
              }
            </p>

          </div>


          <div class="footer">
            Gerado por Ateliê Entre Linhas
          </div>


          <script>

            window.onload = function() {
              window.print();
              window.close();
            }

          </script>

        </body>

      </html>
      `
    );


    janelaImpressao.document.close();
  };


  return (

    <div
      style={{
        width: 'min(1120px, 94%)',
        margin: '38px auto 70px',
        fontFamily:
          "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
        color: '#4A424A'
      }}
    >


      {/* CABEÇALHO */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '25px',
          marginBottom: '25px'
        }}
      >

        <div>

          <span
            style={{
              display: 'block',
              marginBottom: '6px',
              color: '#917687',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '1.4px',
              textTransform: 'uppercase'
            }}
          >
            Mensagens
          </span>


          <h1
            style={{
              margin: 0,
              color: '#3E2445',
              fontFamily:
                "'Playfair Display', Georgia, serif",
              fontSize: '34px'
            }}
          >
            Conversa e negociação
          </h1>


          <p
            style={{
              maxWidth: '620px',
              margin: '8px 0 0',
              color: '#857885',
              fontSize: '13px',
              lineHeight: '1.6'
            }}
          >
            Converse sobre o pedido,
            combine medidas, valores e prazos
            em um único lugar.
          </p>

        </div>


        <button
          type="button"
          onClick={handleVoltarPedidos}
          style={{
            padding: '9px 15px',
            background: '#FFFFFF',
            color: '#7A5B72',
            border: '1px solid #D8CFD5',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          ← Voltar aos pedidos
        </button>

      </div>



      {/* GRID PRINCIPAL */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 2fr) minmax(270px, 0.85fr)',
          gap: '18px',
          alignItems: 'start'
        }}
      >


        {/* CHAT */}

        <div
          style={{
            minHeight: '650px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#FFFFFF',
            border: '1px solid #EBE5E0',
            borderRadius: '15px',
            boxShadow:
              '0 10px 28px rgba(62,36,69,0.06)'
          }}
        >


          {/* CABEÇALHO CHAT */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '17px 20px',
              borderBottom:
                '1px solid #F0EAE7'
            }}
          >

            <div
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                borderRadius: '50%',
                background: '#F3ECEF',
                color: '#7A5B72',
                fontFamily:
                  "'Playfair Display', Georgia, serif",
                fontSize: '17px',
                fontWeight: '700'
              }}
            >
              {
                nomeUsuario
                  ?.charAt(0)
                  .toUpperCase()
              }
            </div>


            <div
              style={{
                flex: 1
              }}
            >

              <span
                style={{
                  color: '#A0949C',
                  fontSize: '9px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}
              >
                Conversa ativa
              </span>


              <h2
                style={{
                  margin: '2px 0',
                  color: '#3E2445',
                  fontFamily:
                    "'Playfair Display', Georgia, serif",
                  fontSize: '17px'
                }}
              >
                Atendimento direto
              </h2>


              <p
                style={{
                  margin: 0,
                  color: '#91858E',
                  fontSize: '10px'
                }}
              >
                Conectado como{' '}
                <strong>
                  {nomeUsuario}
                </strong>
                {' '}· {papelAtual}
              </p>

            </div>


            <span
              style={{
                color: '#70836C',
                fontSize: '10px',
                fontWeight: '700'
              }}
            >
              ● Online
            </span>

          </div>



          {/* ÁREA DE MENSAGENS */}

          <div
            style={{
              flex: 1,
              minHeight: '470px',
              maxHeight: '540px',
              overflowY: 'auto',
              padding: '22px',
              background: '#FAF7F5'
            }}
          >

            {
              mensagens.length === 0
                ? (

                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}
                  >

                    <div
                      style={{
                        width: '45px',
                        height: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        background: '#F3ECEF',
                        color: '#7A5B72',
                        borderRadius: '50%',
                        fontSize: '18px'
                      }}
                    >
                      ✉
                    </div>


                    <h3
                      style={{
                        margin: '0 0 5px',
                        color: '#3E2445',
                        fontFamily:
                          "'Playfair Display', Georgia, serif",
                        fontSize: '17px'
                      }}
                    >
                      Nenhuma mensagem ainda
                    </h3>


                    <p
                      style={{
                        maxWidth: '350px',
                        margin: 0,
                        color: '#91858E',
                        fontSize: '11px',
                        lineHeight: '1.5'
                      }}
                    >
                      Use o campo abaixo
                      para iniciar a conversa
                      sobre este pedido.
                    </p>

                  </div>

                )
                : (

                  mensagens.map(
                    (msg) => {

                      const eEu =
                        msg.remetente ===
                        papelAtual;

                      const eSistema =
                        msg.tipo ===
                        'sistema';


                      if (eSistema) {

                        return (

                          <div
                            key={msg.id}
                            style={{
                              width: 'fit-content',
                              maxWidth: '80%',
                              margin:
                                '12px auto',
                              padding:
                                '8px 12px',
                              background:
                                '#EEF4EC',
                              color:
                                '#61745D',
                              borderRadius:
                                '8px',
                              textAlign:
                                'center',
                              fontSize:
                                '10px',
                              fontWeight:
                                '700'
                            }}
                          >
                            {msg.texto}
                          </div>

                        );
                      }


                      return (

                        <div
                          key={msg.id}
                          style={{
                            display:
                              'flex',
                            flexDirection:
                              'column',
                            alignItems:
                              eEu
                                ? 'flex-end'
                                : 'flex-start',
                            marginBottom:
                              '15px'
                          }}
                        >


                          <span
                            style={{
                              marginBottom:
                                '4px',
                              color:
                                '#A0949C',
                              fontSize:
                                '9px'
                            }}
                          >
                            {
                              msg.nomeRemetente
                            }
                            {' '}·{' '}
                            {msg.hora}
                          </span>


                          <div
                            style={{
                              maxWidth:
                                '78%',
                              padding:
                                '10px 13px',

                              background:
                                eEu
                                  ? '#7A5B72'
                                  : '#FFFFFF',

                              color:
                                eEu
                                  ? '#FFFFFF'
                                  : '#554C54',

                              border:
                                eEu
                                  ? 'none'
                                  : '1px solid #E9E1DD',

                              borderRadius:
                                eEu
                                  ? '12px 12px 3px 12px'
                                  : '12px 12px 12px 3px',

                              fontSize:
                                '11px',

                              lineHeight:
                                '1.55',

                              whiteSpace:
                                'pre-line',

                              boxShadow:
                                '0 4px 10px rgba(62,36,69,0.06)'
                            }}
                          >


                            {
                              msg.texto
                            }


                            {
                              msg.tipo ===
                                'orcamento' &&
                              (

                                <div
                                  style={{
                                    marginTop:
                                      '10px',
                                    paddingTop:
                                      '10px',
                                    borderTop:
                                      eEu
                                        ? '1px solid rgba(255,255,255,0.25)'
                                        : '1px solid #EBE5E0'
                                  }}
                                >


                                  {
                                    !isCostureira &&
                                    !orcamento?.aprovado &&
                                    (

                                      <button
                                        type="button"
                                        onClick={
                                          handleAprovarOrcamento
                                        }
                                        style={{
                                          width:
                                            '100%',
                                          padding:
                                            '8px 10px',
                                          background:
                                            '#6F866A',
                                          color:
                                            '#FFFFFF',
                                          border:
                                            'none',
                                          borderRadius:
                                            '6px',
                                          fontSize:
                                            '10px',
                                          fontWeight:
                                            '700',
                                          cursor:
                                            'pointer'
                                        }}
                                      >
                                        Aprovar orçamento e pagar sinal
                                        {' '}
                                        (R$ {
                                          msg
                                            .dadosOrcamento
                                            .sinal
                                            .toFixed(2)
                                        })
                                      </button>

                                    )
                                  }


                                  {
                                    orcamento?.aprovado &&
                                    (

                                      <span
                                        style={{
                                          display:
                                            'block',
                                          color:
                                            eEu
                                              ? '#D7E8D3'
                                              : '#6F866A',
                                          fontSize:
                                            '10px',
                                          fontWeight:
                                            '700'
                                        }}
                                      >
                                        ✓ Orçamento aprovado pelo cliente
                                      </span>

                                    )
                                  }

                                </div>

                              )
                            }

                          </div>

                        </div>

                      );

                    }
                  )

                )
            }

          </div>



          {/* ENVIO */}

          <form
            onSubmit={
              handleEnviarMensagem
            }
            style={{
              display: 'flex',
              gap: '9px',
              padding: '14px 16px',
              borderTop:
                '1px solid #F0EAE7',
              background: '#FFFFFF'
            }}
          >

            <input
              type="text"
              value={
                novaMensagem
              }
              onChange={
                (e) =>
                  setNovaMensagem(
                    e.target.value
                  )
              }
              placeholder="Escreva uma mensagem..."
              style={{
                flex: 1,
                minWidth: 0,
                padding:
                  '10px 13px',
                background:
                  '#FAF8F7',
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


            <button
              type="submit"
              style={{
                padding:
                  '10px 18px',
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
              Enviar
            </button>

          </form>

        </div>



        {/* LATERAL */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >


          {/* ORÇAMENTO */}

          <div
            style={{
              padding: '20px',
              background: '#FFFFFF',
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
                color:
                  '#917687',
                fontSize:
                  '9px',
                fontWeight:
                  '700',
                letterSpacing:
                  '1.2px',
                textTransform:
                  'uppercase'
              }}
            >
              Negociação
            </span>


            <h3
              style={{
                margin:
                  '4px 0 14px',
                paddingBottom:
                  '12px',
                borderBottom:
                  '1px solid #F0EAE7',
                color:
                  '#3E2445',
                fontFamily:
                  "'Playfair Display', Georgia, serif",
                fontSize:
                  '17px'
              }}
            >
              Orçamento
            </h3>


            <div
              style={{
                padding:
                  '11px 12px',
                marginBottom:
                  '14px',
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
                  color:
                    '#9A8E96',
                  fontSize:
                    '8px',
                  fontWeight:
                    '700',
                  textTransform:
                    'uppercase'
                }}
              >
                Status
              </span>


              <strong
                style={{
                  color:
                    '#655360',
                  fontSize:
                    '10px'
                }}
              >
                {
                  statusPagamento
                }
              </strong>

            </div>


            {
              orcamento
                ? (

                  <div>

                    <span
                      style={{
                        display:
                          'block',
                        color:
                          '#9A8E96',
                        fontSize:
                          '8px'
                      }}
                    >
                      Valor total
                    </span>


                    <strong
                      style={{
                        display:
                          'block',
                        margin:
                          '2px 0 12px',
                        color:
                          '#3E2445',
                        fontFamily:
                          "'Playfair Display', Georgia, serif",
                        fontSize:
                          '22px'
                      }}
                    >
                      R$ {
                        orcamento
                          .valor
                          .toFixed(2)
                      }
                    </strong>


                    <p
                      style={{
                        margin:
                          '6px 0',
                        fontSize:
                          '10px',
                        color:
                          '#625962'
                      }}
                    >
                      <strong>
                        Sinal:
                      </strong>
                      {' '}
                      R$ {
                        orcamento
                          .sinal
                          .toFixed(2)
                      }
                    </p>


                    <p
                      style={{
                        margin:
                          '6px 0 14px',
                        fontSize:
                          '10px',
                        color:
                          '#625962'
                      }}
                    >
                      <strong>
                        Prazo:
                      </strong>
                      {' '}
                      {
                        orcamento
                          .prazo
                      }
                    </p>


                    <button
                      type="button"
                      onClick={
                        handleExportarPDFOrcamento
                      }
                      style={{
                        width:
                          '100%',
                        padding:
                          '9px 10px',
                        marginBottom:
                          '7px',
                        background:
                          '#FFFFFF',
                        color:
                          '#6A5965',
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
                      Gerar PDF do orçamento
                    </button>


                    {
                      isCostureira &&
                      !orcamento.aprovado &&
                      (

                        <button
                          type="button"
                          onClick={
                            handleAbrirModalOrcamento
                          }
                          style={{
                            width:
                              '100%',
                            padding:
                              '9px 10px',
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
                          Editar orçamento
                        </button>

                      )
                    }

                  </div>

                )
                : (

                  <div>

                    <p
                      style={{
                        margin:
                          '0 0 12px',
                        color:
                          '#91858E',
                        fontSize:
                          '10px',
                        lineHeight:
                          '1.5'
                      }}
                    >
                      Nenhum orçamento
                      foi emitido para
                      esta conversa.
                    </p>


                    {
                      isCostureira &&
                      (

                        <button
                          type="button"
                          onClick={
                            handleAbrirModalOrcamento
                          }
                          style={{
                            width:
                              '100%',
                            padding:
                              '9px 10px',
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
                          + Emitir orçamento
                        </button>

                      )
                    }

                  </div>

                )
            }

          </div>



          {/* MEDIDAS */}

          <div
            style={{
              padding:
                '20px',
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
                  'flex-start',
                gap:
                  '10px',
                paddingBottom:
                  '12px',
                marginBottom:
                  '13px',
                borderBottom:
                  '1px solid #F0EAE7'
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
                  Informações da peça
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
                      '17px'
                  }}
                >
                  Ficha de medidas
                </h3>

              </div>


              <button
                type="button"
                onClick={
                  () =>
                    setEditandoMedidas(
                      !editandoMedidas
                    )
                }
                style={{
                  padding:
                    0,
                  background:
                    'none',
                  color:
                    '#7A5B72',
                  border:
                    'none',
                  fontSize:
                    '9px',
                  fontWeight:
                    '700',
                  cursor:
                    'pointer'
                }}
              >
                {
                  editandoMedidas
                    ? 'Cancelar'
                    : 'Editar'
                }
              </button>

            </div>


            {
              editandoMedidas
                ? (

                  <form
                    onSubmit={
                      handleSalvarMedidas
                    }
                  >

                    {
                      [
                        [
                          'Busto',
                          'busto',
                          'Ex.: 90 cm'
                        ],

                        [
                          'Cintura',
                          'cintura',
                          'Ex.: 70 cm'
                        ],

                        [
                          'Quadril',
                          'quadril',
                          'Ex.: 98 cm'
                        ],

                        [
                          'Altura',
                          'altura',
                          'Ex.: 1,65 m'
                        ],

                        [
                          'Comprimento desejado',
                          'comprimentoDesejado',
                          'Ex.: 100 cm'
                        ]
                      ].map(
                        (
                          [
                            label,
                            campo,
                            placeholder
                          ]
                        ) => (

                          <label
                            key={
                              campo
                            }
                            style={{
                              display:
                                'block',
                              marginBottom:
                                '9px',
                              color:
                                '#554C54',
                              fontSize:
                                '9px',
                              fontWeight:
                                '700'
                            }}
                          >

                            {
                              label
                            }


                            <input
                              type="text"
                              value={
                                medidas[
                                  campo
                                ]
                              }
                              onChange={
                                (e) =>
                                  setMedidas({
                                    ...medidas,
                                    [campo]:
                                      e.target.value
                                  })
                              }
                              placeholder={
                                placeholder
                              }
                              style={{
                                width:
                                  '100%',
                                marginTop:
                                  '4px',
                                padding:
                                  '9px 10px',
                                boxSizing:
                                  'border-box',
                                border:
                                  '1px solid #DED6D1',
                                borderRadius:
                                  '7px',
                                outline:
                                  'none',
                                fontSize:
                                  '10px'
                              }}
                            />

                          </label>

                        )
                      )
                    }


                    <button
                      type="submit"
                      style={{
                        width:
                          '100%',
                        padding:
                          '9px 10px',
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
                      Salvar medidas
                    </button>

                  </form>

                )
                : (

                  <div>

                    {
                      [
                        [
                          'Busto',
                          medidas.busto
                        ],

                        [
                          'Cintura',
                          medidas.cintura
                        ],

                        [
                          'Quadril',
                          medidas.quadril
                        ],

                        [
                          'Altura',
                          medidas.altura
                        ],

                        [
                          'Comprimento',
                          medidas.comprimentoDesejado
                        ]
                      ].map(
                        (
                          [
                            label,
                            valor
                          ]
                        ) => (

                          <div
                            key={
                              label
                            }
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'space-between',
                              gap:
                                '10px',
                              padding:
                                '8px 0',
                              borderBottom:
                                '1px solid #F3EEEB'
                            }}
                          >

                            <span
                              style={{
                                color:
                                  '#91858E',
                                fontSize:
                                  '9px'
                              }}
                            >
                              {
                                label
                              }
                            </span>


                            <strong
                              style={{
                                color:
                                  valor
                                    ? '#554C54'
                                    : '#AAA0A6',
                                fontSize:
                                  '9px',
                                fontWeight:
                                  '600'
                              }}
                            >
                              {
                                valor ||
                                'Não informado'
                              }
                            </strong>

                          </div>

                        )
                      )
                    }

                  </div>

                )
            }


            <div
              style={{
                display:
                  'flex',
                flexDirection:
                  'column',
                gap:
                  '7px',
                marginTop:
                  '14px'
              }}
            >

              <button
                type="button"
                onClick={
                  handleExportarPDFMedidas
                }
                style={{
                  width:
                    '100%',
                  padding:
                    '9px 10px',
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
                Exportar ficha em PDF
              </button>


              <button
                type="button"
                onClick={
                  handleExportarTXT
                }
                style={{
                  width:
                    '100%',
                  padding:
                    '9px 10px',
                  background:
                    '#FFFFFF',
                  color:
                    '#6A5965',
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
                Baixar texto (.TXT)
              </button>

            </div>

          </div>

        </div>

      </div>



      {/* MODAL DE ORÇAMENTO */}

      {
        mostrarModalOrcamento &&
        (

          <div
            style={{
              position:
                'fixed',
              top:
                0,
              left:
                0,
              right:
                0,
              bottom:
                0,
              zIndex:
                1000,
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              padding:
                '20px',
              background:
                'rgba(49,35,47,0.44)'
            }}
          >

            <div
              style={{
                width:
                  'min(440px, 100%)',
                padding:
                  '25px',
                background:
                  '#FFFFFF',
                border:
                  '1px solid #EBE5E0',
                borderRadius:
                  '14px',
                boxShadow:
                  '0 18px 50px rgba(40,26,38,0.18)'
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
                Proposta
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
                    '21px'
                }}
              >
                {
                  orcamento
                    ? 'Editar orçamento'
                    : 'Emitir orçamento'
                }
              </h3>


              <p
                style={{
                  margin:
                    '6px 0 20px',
                  color:
                    '#91858E',
                  fontSize:
                    '10px',
                  lineHeight:
                    '1.5'
                }}
              >
                Informe o serviço,
                valor e prazo combinado.
              </p>


              <form
                onSubmit={
                  handleSalvarOrcamento
                }
              >


                <label
                  style={{
                    display:
                      'block',
                    marginBottom:
                      '13px',
                    color:
                      '#554C54',
                    fontSize:
                      '10px',
                    fontWeight:
                      '700'
                  }}
                >
                  Descrição do serviço

                  <input
                    type="text"
                    value={
                      formOrcamento
                        .descricao
                    }
                    onChange={
                      (e) =>
                        setFormOrcamento({
                          ...formOrcamento,
                          descricao:
                            e.target.value
                        })
                    }
                    placeholder="Ex.: Ajuste de barra e zíper"
                    required
                    style={{
                      width:
                        '100%',
                      marginTop:
                        '5px',
                      padding:
                        '10px',
                      boxSizing:
                        'border-box',
                      border:
                        '1px solid #DED6D1',
                      borderRadius:
                        '7px',
                      outline:
                        'none'
                    }}
                  />

                </label>


                <label
                  style={{
                    display:
                      'block',
                    marginBottom:
                      '13px',
                    color:
                      '#554C54',
                    fontSize:
                      '10px',
                    fontWeight:
                      '700'
                  }}
                >
                  Valor total (R$)

                  <input
                    type="number"
                    step="0.01"
                    value={
                      formOrcamento
                        .valor
                    }
                    onChange={
                      (e) =>
                        setFormOrcamento({
                          ...formOrcamento,
                          valor:
                            e.target.value
                        })
                    }
                    placeholder="0,00"
                    required
                    style={{
                      width:
                        '100%',
                      marginTop:
                        '5px',
                      padding:
                        '10px',
                      boxSizing:
                        'border-box',
                      border:
                        '1px solid #DED6D1',
                      borderRadius:
                        '7px',
                      outline:
                        'none'
                    }}
                  />

                </label>


                <label
                  style={{
                    display:
                      'block',
                    marginBottom:
                      '20px',
                    color:
                      '#554C54',
                    fontSize:
                      '10px',
                    fontWeight:
                      '700'
                  }}
                >
                  Prazo estimado

                  <input
                    type="text"
                    value={
                      formOrcamento
                        .prazo
                    }
                    onChange={
                      (e) =>
                        setFormOrcamento({
                          ...formOrcamento,
                          prazo:
                            e.target.value
                        })
                    }
                    placeholder="Ex.: 3 dias úteis"
                    required
                    style={{
                      width:
                        '100%',
                      marginTop:
                        '5px',
                      padding:
                        '10px',
                      boxSizing:
                        'border-box',
                      border:
                        '1px solid #DED6D1',
                      borderRadius:
                        '7px',
                      outline:
                        'none'
                    }}
                  />

                </label>


                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'flex-end',
                    gap:
                      '8px'
                  }}
                >

                  <button
                    type="button"
                    onClick={
                      () =>
                        setMostrarModalOrcamento(
                          false
                        )
                    }
                    style={{
                      padding:
                        '9px 15px',
                      background:
                        '#FFFFFF',
                      color:
                        '#6A5965',
                      border:
                        '1px solid #D8CFD5',
                      borderRadius:
                        '7px',
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
                        '9px 15px',
                      background:
                        '#7A5B72',
                      color:
                        '#FFFFFF',
                      border:
                        'none',
                      borderRadius:
                        '7px',
                      fontSize:
                        '10px',
                      fontWeight:
                        '700',
                      cursor:
                        'pointer'
                    }}
                  >
                    {
                      orcamento
                        ? 'Salvar alterações'
                        : 'Enviar proposta'
                    }
                  </button>

                </div>

              </form>

            </div>

          </div>

        )
      }

    </div>
  );
}

export default Chat;