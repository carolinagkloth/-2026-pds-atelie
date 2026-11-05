import React, { useEffect, useState } from 'react';

function Chat({
  pedido,
  usuario,
  usuarioLogado,
  onNavigate
}) {

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

  const idUsuario =
    user?.id_usuario ||
    user?.id;

  const nomeUsuario =
    user?.nome ||
    'Usuário';

  const isCostureira =
    (
      user?.tipo_usuario ||
      user?.tipoUsuario ||
      ''
    )
      .toString()
      .toLowerCase() === 'costureira';

  const papelAtual =
    isCostureira
      ? 'Costureira'
      : 'Cliente';

  /*
    Compatibilidade com:
    - FeedPedidos
    - MeusChats atual da Carolina
  */
  const idPedido =
    pedido?.id ||
    pedido?.id_pedido ||
    pedido?.idPedido;

  const idClientePedido =
    pedido?.clienteId ||
    pedido?.id_cliente ||
    (
      isCostureira
        ? null
        : idUsuario
    );

  /* ========================================
     ESTADOS
  ======================================== */

  const [mensagens, setMensagens] =
    useState([]);

  const [novaMensagem, setNovaMensagem] =
    useState('');

  const [
    mostrarModalProposta,
    setMostrarModalProposta
  ] = useState(false);

  const [
    mostrarModalMedidas,
    setMostrarModalMedidas
  ] = useState(false);

  const [
    mostrarModalProva,
    setMostrarModalProva
  ] = useState(false);

  const [formProva, setFormProva] =
    useState({
      dataProva: '',
      observacao: ''
    });

  const [orcamentoAtual, setOrcamentoAtual] =
    useState({
      total: 0,
      entrada: 0,
      prazo: '',
      status: pedido?.status || 'Pendente',
      descricao: ''
    });

  const [medidas, setMedidas] =
    useState({
      busto: '',
      cintura: '',
      quadril: '',
      altura: '',
      comprimento: '',
      observacoes_medidas: ''
    });

  const [propostaForm, setPropostaForm] =
    useState({
      descricao: '',
      valorTotal: '',
      valorEntrada: '',
      previsaoEntrega: ''
    });

  /* ========================================
     CARREGAMENTO
  ======================================== */

  useEffect(() => {

    if (idPedido) {
      carregarMensagens();
    }

    carregarMedidasCliente();

  }, [idPedido, idClientePedido]);

  /* ========================================
     MEDIDAS
     BACKEND ATUAL
  ======================================== */

  const carregarMedidasCliente = () => {

    const targetId =
      idClientePedido ||
      idUsuario;

    if (!targetId) return;

    fetch(
      `/api/usuarios/${targetId}/medidas`
    )
      .then((res) => res.json())

      .then((data) => {

        if (data && !data.erro) {

          setMedidas({
            busto:
              data.busto || '',

            cintura:
              data.cintura || '',

            quadril:
              data.quadril || '',

            altura:
              data.altura || '',

            comprimento:
              data.comprimento || '',

            observacoes_medidas:
              data.observacoes_medidas || ''
          });

        }

      })

      .catch(() => {});

  };

  const salvarMedidasCliente =
    async () => {

      const targetId =
        idClientePedido ||
        idUsuario;

      if (!targetId) return;

      try {

        const response =
          await fetch(
            `/api/usuarios/${targetId}/medidas`,
            {
              method: 'PUT',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify(medidas)
            }
          );

        if (response.ok) {

          alert(
            'Medidas salvas com sucesso!'
          );

          setMostrarModalMedidas(
            false
          );

        }

      } catch (err) {

        alert(
          `Erro ao salvar medidas: ${err.message}`
        );

      }

    };

  /* ========================================
     MENSAGENS
     BACKEND ATUAL
  ======================================== */

  const carregarMensagens = () => {

    if (!idPedido) return;

    fetch(
      `/api/mensagens-chat/${idPedido}`
    )

      .then((res) => res.json())

      .then((data) => {

        if (!Array.isArray(data)) {
          return;
        }

        setMensagens(data);

        const propostaExistente =
          [...data]
            .reverse()
            .find(
              (m) =>
                m.tipo_mensagem === 'proposta' ||
                (
                  m.conteudo &&
                  m.conteudo.includes(
                    'Proposta de Orçamento:'
                  )
                )
            );

        if (propostaExistente) {

          let dados =
            propostaExistente
              .dados_proposta || {};

          if (
            typeof dados === 'string'
          ) {

            try {
              dados = JSON.parse(dados);
            } catch {
              dados = {};
            }

          }

          setOrcamentoAtual({
            total:
              dados.valorTotal || 0,

            entrada:
              dados.valorEntrada || 0,

            prazo:
              dados.previsaoEntrega ||
              pedido?.prazoDesejado ||
              '',

            status:
              pedido?.status ||
              'Aguardando Aprovação',

            descricao:
              dados.descricaoServico ||
              ''
          });

        }

      })

      .catch(() => {});

  };

  const handleEnviarMensagem =
    async (e) => {

      e.preventDefault();

      if (!idPedido) {
        alert(
          'Abra uma conversa real para enviar mensagens.'
        );
        return;
      }

      if (!novaMensagem.trim()) {
        return;
      }

      try {

        const response =
          await fetch(
            '/api/mensagens-chat',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body: JSON.stringify({
                id_pedido:
                  Number(idPedido),

                id_remetente:
                  Number(idUsuario),

                conteudo:
                  novaMensagem.trim(),

                tipo_mensagem:
                  'texto'
              })
            }
          );

        if (response.ok) {

          setNovaMensagem('');

          carregarMensagens();

        }

      } catch (err) {

        alert(
          `Erro: ${err.message}`
        );

      }

    };

  /* ========================================
     PROPOSTA
  ======================================== */

  const handleEnviarProposta =
    async (e) => {

      e.preventDefault();

      if (!idPedido) {
        alert(
          'Abra uma conversa real para enviar um orçamento.'
        );
        return;
      }

      const total =
        parseFloat(
          propostaForm.valorTotal
        );

      if (
        isNaN(total) ||
        total <= 0
      ) {

        alert(
          'Informe um valor total válido.'
        );

        return;

      }

      const entrada =
        propostaForm.valorEntrada
          ? parseFloat(
              propostaForm.valorEntrada
            )
          : 0;

      const textoFormatado =
        `Proposta de Orçamento:\n` +
        `Serviço: ${propostaForm.descricao}\n` +
        `Valor Total: R$ ${total.toFixed(2)}` +
        (
          entrada > 0
            ? `\nEntrada (Sinal): R$ ${entrada.toFixed(2)}`
            : ''
        ) +
        `\nPrevisão de Entrega: ${
          propostaForm.previsaoEntrega
            ? new Date(
                propostaForm.previsaoEntrega
              ).toLocaleDateString('pt-BR')
            : 'A combinar'
        }`;

      try {

        const response =
          await fetch(
            '/api/mensagens-chat',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  id_pedido:
                    Number(idPedido),

                  id_remetente:
                    Number(idUsuario),

                  conteudo:
                    textoFormatado,

                  tipo_mensagem:
                    'proposta',

                  valor_entrada:
                    entrada,

                  valor_proposta:
                    total,

                  dados_proposta: {
                    descricaoServico:
                      propostaForm.descricao,

                    valorTotal:
                      total,

                    valorEntrada:
                      entrada,

                    previsaoEntrega:
                      propostaForm.previsaoEntrega,

                    idCostureira:
                      idUsuario
                  }
                })
            }
          );

        if (response.ok) {

          setMostrarModalProposta(
            false
          );

          carregarMensagens();

          alert(
            'Proposta enviada!'
          );

        }

      } catch (err) {

        alert(
          `Erro: ${err.message}`
        );

      }

    };

  /* ========================================
     ACEITAR PROPOSTA
  ======================================== */

  const handleAceitarProposta =
    async (
      dadosProposta,
      idRemetenteProposta
    ) => {

      let dados =
        dadosProposta || {};

      if (
        typeof dados === 'string'
      ) {

        try {
          dados =
            JSON.parse(dados);
        } catch {
          dados = {};
        }

      }

      const idCostureira =
        dados.idCostureira ||
        idRemetenteProposta ||
        pedido?.costureiraId;

      try {

        const response =
          await fetch(
            '/api/ordens-servico',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  id_pedido:
                    idPedido,

                  id_costureira:
                    idCostureira,

                  valor_total:
                    dados.valorTotal ||
                    orcamentoAtual.total,

                  valor_entrada:
                    dados.valorEntrada ||
                    orcamentoAtual.entrada,

                  previsao_entrega:
                    dados.previsaoEntrega ||
                    orcamentoAtual.prazo
                })
            }
          );

        if (response.ok) {

          alert(
            'Orçamento aprovado! O pedido iniciou em Produção.'
          );

          setOrcamentoAtual(
            (prev) => ({
              ...prev,
              status: 'Em Produção'
            })
          );

          if (onNavigate) {
            onNavigate('meusPedidos');
          }

        }

      } catch (err) {

        alert(
          `Erro: ${err.message}`
        );

      }

    };

  /* ========================================
     AGENDAR PROVA
  ======================================== */

  const handleAgendarProva =
    async (e) => {

      e.preventDefault();

      if (!idPedido) {
        alert(
          'Abra uma conversa real para agendar uma prova.'
        );
        return;
      }

      if (!formProva.dataProva) {

        alert(
          'Selecione uma data para a prova!'
        );

        return;

      }

      try {

        const response =
          await fetch(
            '/api/ordens-servico/agendar-prova',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  id_pedido:
                    idPedido,

                  id_costureira:
                    idUsuario,

                  dataProva:
                    formProva.dataProva,

                  observacao:
                    formProva.observacao
                })
            }
          );

        if (response.ok) {

          alert(
            'Prova da peça agendada com sucesso!'
          );

          setMostrarModalProva(false);

          setOrcamentoAtual(
            (prev) => ({
              ...prev,
              status: 'Aguardando Prova'
            })
          );

          carregarMensagens();

        } else {

          const data =
            await response.json();

          alert(
            data.erro ||
            'Erro ao agendar prova.'
          );

        }

      } catch (err) {

        alert(
          `Erro: ${err.message}`
        );

      }

    };

  /* ========================================
     NAVEGAÇÃO
  ======================================== */

  const handleVoltarPedidos = () => {

    if (!onNavigate) return;

    onNavigate(
      isCostureira
        ? 'feedPedidos'
        : 'meusPedidos'
    );

  };

  const formatarHorario = (msg) => {

    const valor =
      msg.data_envio ||
      msg.criado_em ||
      msg.data;

    if (!valor) return '';

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return '';
    }

    return data.toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    );

  };

  /* ========================================
     RENDER
  ======================================== */

  return (

    <div style={paginaStyle}>

      {/* CABEÇALHO */}

      <section style={cabecalhoStyle}>

        <div>

          <span style={eyebrowStyle}>
            Mensagens
          </span>

          <h1 style={tituloPaginaStyle}>
            Conversa e negociação
          </h1>

          <p style={subtituloStyle}>
            Converse sobre o pedido, combine
            medidas, valores e prazos em um único
            lugar.
          </p>

        </div>

        <div style={acoesTopoStyle}>

          <button
            type="button"
            onClick={() =>
              onNavigate &&
              onNavigate('meusChats')
            }
            style={botaoSecundarioStyle}
          >
            Conversas
          </button>

          <button
            type="button"
            onClick={handleVoltarPedidos}
            style={botaoSecundarioStyle}
          >
            ← Voltar aos pedidos
          </button>

        </div>

      </section>

      {/* GRID */}

      <div style={gridStyle}>

        {/* CHAT */}

        <section style={chatStyle}>

          <div style={chatHeaderStyle}>

            <div style={avatarStyle}>
              {
                nomeUsuario
                  .charAt(0)
                  .toUpperCase()
              }
            </div>

            <div style={{ flex: 1 }}>

              <span style={miniLabelStyle}>
                Conversa ativa
              </span>

              <h2 style={tituloChatStyle}>
                Atendimento direto
              </h2>

              <p style={conectadoStyle}>
                Conectado como{' '}
                <strong>
                  {nomeUsuario}
                </strong>
                {' · '}
                {papelAtual}
              </p>

            </div>

            <span style={onlineStyle}>
              ● Online
            </span>

          </div>

          {/* MENSAGENS */}

          <div style={mensagensStyle}>

            {
              mensagens.length === 0
                ? (

                  <div style={vazioStyle}>

                    <div style={iconeVazioStyle}>
                      ✉
                    </div>

                    <h3 style={tituloVazioStyle}>
                      Nenhuma mensagem ainda
                    </h3>

                    <p style={textoVazioStyle}>
                      Use o campo abaixo para
                      iniciar a conversa sobre
                      este pedido.
                    </p>

                  </div>

                )
                : (

                  mensagens.map((msg) => {

                    const ehMinha =
                      Number(
                        msg.id_remetente
                      ) ===
                      Number(idUsuario);

                    const ehProposta =
                      msg.tipo_mensagem ===
                        'proposta' ||
                      (
                        msg.conteudo &&
                        msg.conteudo.includes(
                          'Proposta de Orçamento:'
                        )
                      );

                    return (

                      <div
                        key={
                          msg.id_mensagem ||
                          msg.id
                        }
                        style={{
                          display: 'flex',
                          flexDirection: 'column',

                          alignItems:
                            ehMinha
                              ? 'flex-end'
                              : 'flex-start',

                          marginBottom: '15px'
                        }}
                      >

                        <span style={nomeMensagemStyle}>
                          {
                            msg.remetente_nome ||
                            (
                              ehMinha
                                ? 'Você'
                                : 'Interlocutor'
                            )
                          }

                          {
                            formatarHorario(msg)
                              ? ` · ${formatarHorario(msg)}`
                              : ''
                          }
                        </span>

                        <div
                          style={{
                            ...balaoBaseStyle,

                            background:
                              ehMinha
                                ? '#7A5B72'
                                : '#FFFFFF',

                            color:
                              ehMinha
                                ? '#FFFFFF'
                                : '#554C54',

                            border:
                              ehMinha
                                ? 'none'
                                : '1px solid #E9E1DD',

                            borderRadius:
                              ehMinha
                                ? '12px 12px 3px 12px'
                                : '12px 12px 12px 3px'
                          }}
                        >

                          {msg.conteudo}

                          {
                            !isCostureira &&
                            ehProposta &&
                            (

                              <div
                                style={{
                                  marginTop: '10px',
                                  paddingTop: '10px',

                                  borderTop:
                                    ehMinha
                                      ? '1px solid rgba(255,255,255,0.25)'
                                      : '1px solid #EBE5E0'
                                }}
                              >

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAceitarProposta(
                                      msg.dados_proposta ||
                                        {},
                                      msg.id_remetente
                                    )
                                  }
                                  style={botaoAprovarStyle}
                                >
                                  Aprovar orçamento e iniciar serviço
                                </button>

                              </div>

                            )
                          }

                        </div>

                      </div>

                    );

                  })

                )
            }

          </div>

          {/* ENVIO */}

          <form
            onSubmit={handleEnviarMensagem}
            style={envioStyle}
          >

            <input
              type="text"
              value={novaMensagem}
              onChange={(e) =>
                setNovaMensagem(
                  e.target.value
                )
              }
              placeholder="Escreva uma mensagem..."
              style={inputMensagemStyle}
            />

            <button
              type="submit"
              style={botaoPrincipalStyle}
            >
              Enviar
            </button>

          </form>

        </section>

        {/* LATERAL */}

        <aside style={lateralStyle}>

          {/* NEGOCIAÇÃO */}

          <section style={cardStyle}>

            <span style={eyebrowStyle}>
              Negociação
            </span>

            <h3 style={tituloCardStyle}>
              Status do pedido
            </h3>

            <div style={statusStyle}>

              <span style={statusLabelStyle}>
                Status atual
              </span>

              <strong style={statusValorStyle}>
                {
                  orcamentoAtual.status ||
                  'Pendente'
                }
              </strong>

            </div>

            {
              orcamentoAtual.total > 0 &&
              (

                <div
                  style={{
                    marginBottom: '14px'
                  }}
                >

                  <Linha
                    label="Valor total"
                    valor={
                      `R$ ${Number(
                        orcamentoAtual.total
                      ).toFixed(2)}`
                    }
                  />

                  <Linha
                    label="Entrada"
                    valor={
                      `R$ ${Number(
                        orcamentoAtual.entrada || 0
                      ).toFixed(2)}`
                    }
                  />

                  <Linha
                    label="Previsão"
                    valor={
                      orcamentoAtual.prazo
                        ? new Date(
                            orcamentoAtual.prazo
                          )
                            .toLocaleDateString(
                              'pt-BR'
                            )
                        : 'A combinar'
                    }
                  />

                </div>

              )
            }

            {
              isCostureira &&
              (

                <div style={acoesLateralStyle}>

                  <button
                    type="button"
                    onClick={() => {

                      setPropostaForm({
                        descricao:
                          pedido?.descricao || '',

                        valorTotal: '',
                        valorEntrada: '',
                        previsaoEntrega: ''
                      });

                      setMostrarModalProposta(
                        true
                      );

                    }}
                    style={botaoPrincipalLargoStyle}
                  >
                    + Enviar orçamento
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarModalProva(
                        true
                      )
                    }
                    style={botaoSecundarioLargoStyle}
                  >
                    Agendar prova da peça
                  </button>

                </div>

              )
            }

          </section>

          {/* MEDIDAS */}

          <section style={cardStyle}>

            <div style={cardTopoStyle}>

              <div>

                <span style={eyebrowStyle}>
                  Cliente
                </span>

                <h3 style={tituloCardStyle}>
                  Ficha de medidas
                </h3>

              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarModalMedidas(
                    true
                  )
                }
                style={botaoEditarStyle}
              >
                Editar
              </button>

            </div>

            <Linha
              label="Busto"
              valor={
                medidas.busto ||
                'Não informado'
              }
            />

            <Linha
              label="Cintura"
              valor={
                medidas.cintura ||
                'Não informado'
              }
            />

            <Linha
              label="Quadril"
              valor={
                medidas.quadril ||
                'Não informado'
              }
            />

            <Linha
              label="Altura"
              valor={
                medidas.altura ||
                'Não informado'
              }
            />

            <Linha
              label="Comprimento"
              valor={
                medidas.comprimento ||
                'Não informado'
              }
            />

            {
              medidas.observacoes_medidas &&
              (

                <div style={observacaoStyle}>

                  <strong>
                    Observações
                  </strong>

                  <p>
                    {
                      medidas.observacoes_medidas
                    }
                  </p>

                </div>

              )
            }

          </section>

        </aside>

      </div>

      {/* ========================================
          MODAL ORÇAMENTO
      ======================================== */}

      {
        mostrarModalProposta &&
        (

          <Modal>

            <span style={eyebrowStyle}>
              Proposta
            </span>

            <h3 style={tituloModalStyle}>
              Enviar orçamento
            </h3>

            <p style={textoModalStyle}>
              Informe o serviço, valores e a
              previsão de entrega.
            </p>

            <form
              onSubmit={
                handleEnviarProposta
              }
            >

              <Campo
                label="Descrição do serviço"
              >

                <textarea
                  rows="4"
                  value={
                    propostaForm.descricao
                  }
                  onChange={(e) =>
                    setPropostaForm({
                      ...propostaForm,

                      descricao:
                        e.target.value
                    })
                  }
                  style={inputStyle}
                  required
                />

              </Campo>

              <Campo
                label="Valor total (R$)"
              >

                <input
                  type="number"
                  step="0.01"
                  value={
                    propostaForm.valorTotal
                  }
                  onChange={(e) =>
                    setPropostaForm({
                      ...propostaForm,

                      valorTotal:
                        e.target.value
                    })
                  }
                  style={inputStyle}
                  required
                />

              </Campo>

              <Campo
                label="Entrada / sinal (R$)"
              >

                <input
                  type="number"
                  step="0.01"
                  value={
                    propostaForm.valorEntrada
                  }
                  onChange={(e) =>
                    setPropostaForm({
                      ...propostaForm,

                      valorEntrada:
                        e.target.value
                    })
                  }
                  style={inputStyle}
                />

              </Campo>

              <Campo
                label="Previsão de entrega"
              >

                <input
                  type="date"
                  value={
                    propostaForm.previsaoEntrega
                  }
                  onChange={(e) =>
                    setPropostaForm({
                      ...propostaForm,

                      previsaoEntrega:
                        e.target.value
                    })
                  }
                  style={inputStyle}
                />

              </Campo>

              <div style={modalAcoesStyle}>

                <button
                  type="button"
                  onClick={() =>
                    setMostrarModalProposta(
                      false
                    )
                  }
                  style={botaoSecundarioStyle}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={botaoPrincipalStyle}
                >
                  Enviar proposta
                </button>

              </div>

            </form>

          </Modal>

        )
      }

      {/* ========================================
          MODAL PROVA
      ======================================== */}

      {
        mostrarModalProva &&
        (

          <Modal>

            <span style={eyebrowStyle}>
              Agenda
            </span>

            <h3 style={tituloModalStyle}>
              Agendar prova da peça
            </h3>

            <p style={textoModalStyle}>
              Defina a data e deixe orientações
              para o cliente.
            </p>

            <form
              onSubmit={handleAgendarProva}
            >

              <Campo label="Data da prova">

                <input
                  type="date"
                  value={
                    formProva.dataProva
                  }
                  onChange={(e) =>
                    setFormProva({
                      ...formProva,

                      dataProva:
                        e.target.value
                    })
                  }
                  style={inputStyle}
                  required
                />

              </Campo>

              <Campo
                label="Observações / instruções"
              >

                <textarea
                  rows="4"
                  value={
                    formProva.observacao
                  }
                  onChange={(e) =>
                    setFormProva({
                      ...formProva,

                      observacao:
                        e.target.value
                    })
                  }
                  placeholder="Ex.: trazer o calçado que será usado com a peça"
                  style={inputStyle}
                />

              </Campo>

              <div style={modalAcoesStyle}>

                <button
                  type="button"
                  onClick={() =>
                    setMostrarModalProva(
                      false
                    )
                  }
                  style={botaoSecundarioStyle}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={botaoPrincipalStyle}
                >
                  Confirmar
                </button>

              </div>

            </form>

          </Modal>

        )
      }

      {/* ========================================
          MODAL MEDIDAS
      ======================================== */}

      {
        mostrarModalMedidas &&
        (

          <Modal>

            <span style={eyebrowStyle}>
              Cliente
            </span>

            <h3 style={tituloModalStyle}>
              Editar ficha de medidas
            </h3>

            <p style={textoModalStyle}>
              Registre as medidas necessárias
              para o serviço.
            </p>

            <div style={gridMedidasStyle}>

              {
                [
                  ['Busto', 'busto'],
                  ['Cintura', 'cintura'],
                  ['Quadril', 'quadril'],
                  ['Altura', 'altura'],
                  ['Comprimento', 'comprimento']
                ]
                  .map(
                    ([label, campo]) => (

                      <Campo
                        key={campo}
                        label={label}
                      >

                        <input
                          type="text"
                          value={
                            medidas[campo]
                          }
                          onChange={(e) =>
                            setMedidas({
                              ...medidas,

                              [campo]:
                                e.target.value
                            })
                          }
                          style={inputStyle}
                        />

                      </Campo>

                    )
                  )
              }

            </div>

            <Campo
              label="Outras medidas e observações"
            >

              <textarea
                rows="4"
                value={
                  medidas.observacoes_medidas
                }
                onChange={(e) =>
                  setMedidas({
                    ...medidas,

                    observacoes_medidas:
                      e.target.value
                  })
                }
                style={inputStyle}
              />

            </Campo>

            <div style={modalAcoesStyle}>

              <button
                type="button"
                onClick={() =>
                  setMostrarModalMedidas(
                    false
                  )
                }
                style={botaoSecundarioStyle}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  salvarMedidasCliente
                }
                style={botaoPrincipalStyle}
              >
                Salvar medidas
              </button>

            </div>

          </Modal>

        )
      }

    </div>

  );

}


/* ========================================
   COMPONENTES
======================================== */

function Linha({
  label,
  valor
}) {

  return (

    <div style={linhaStyle}>

      <span style={linhaLabelStyle}>
        {label}
      </span>

      <strong style={linhaValorStyle}>
        {valor}
      </strong>

    </div>

  );

}


function Modal({
  children
}) {

  return (

    <div style={overlayStyle}>

      <div style={modalStyle}>
        {children}
      </div>

    </div>

  );

}


function Campo({
  label,
  children
}) {

  return (

    <label style={campoStyle}>

      {label}

      {children}

    </label>

  );

}


/* ========================================
   ESTILOS
======================================== */

const paginaStyle = {
  width: 'min(1120px, 94%)',
  margin: '38px auto 70px',
  fontFamily:
    "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  color: '#4A424A'
};


const cabecalhoStyle = {
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
  fontSize: '34px'
};


const subtituloStyle = {
  maxWidth: '620px',
  margin: '8px 0 0',
  color: '#857885',
  fontSize: '13px',
  lineHeight: '1.6'
};


const acoesTopoStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap'
};


const gridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 2fr) minmax(270px, 0.85fr)',
  gap: '18px',
  alignItems: 'start'
};


const chatStyle = {
  minHeight: '650px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  background: '#FFFFFF',
  border: '1px solid #EBE5E0',
  borderRadius: '15px',
  boxShadow:
    '0 10px 28px rgba(62,36,69,0.06)'
};


const chatHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '17px 20px',
  borderBottom:
    '1px solid #F0EAE7'
};


const avatarStyle = {
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
};


const miniLabelStyle = {
  color: '#A0949C',
  fontSize: '9px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.8px'
};


const tituloChatStyle = {
  margin: '2px 0',
  color: '#3E2445',
  fontFamily:
    "'Playfair Display', Georgia, serif",
  fontSize: '17px'
};


const conectadoStyle = {
  margin: 0,
  color: '#91858E',
  fontSize: '10px'
};


const onlineStyle = {
  color: '#70836C',
  fontSize: '10px',
  fontWeight: '700'
};


const mensagensStyle = {
  flex: 1,
  minHeight: '470px',
  maxHeight: '540px',
  overflowY: 'auto',
  padding: '22px',
  background: '#FAF7F5'
};


const vazioStyle = {
  height: '100%',
  minHeight: '420px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center'
};


const iconeVazioStyle = {
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
};


const tituloVazioStyle = {
  margin: '0 0 5px',
  color: '#3E2445',
  fontFamily:
    "'Playfair Display', Georgia, serif",
  fontSize: '17px'
};


const textoVazioStyle = {
  maxWidth: '350px',
  margin: 0,
  color: '#91858E',
  fontSize: '11px',
  lineHeight: '1.5'
};


const nomeMensagemStyle = {
  marginBottom: '4px',
  color: '#A0949C',
  fontSize: '9px'
};


const balaoBaseStyle = {
  maxWidth: '78%',
  padding: '10px 13px',
  fontSize: '11px',
  lineHeight: '1.55',
  whiteSpace: 'pre-line',
  boxShadow:
    '0 4px 10px rgba(62,36,69,0.06)'
};


const envioStyle = {
  display: 'flex',
  gap: '9px',
  padding: '14px 16px',
  borderTop:
    '1px solid #F0EAE7',
  background: '#FFFFFF'
};


const inputMensagemStyle = {
  flex: 1,
  minWidth: 0,
  padding: '10px 13px',
  background: '#FAF8F7',
  color: '#4A424A',
  border: '1px solid #DED6D1',
  borderRadius: '8px',
  outline: 'none',
  fontSize: '11px'
};


const lateralStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};


const cardStyle = {
  padding: '20px',
  background: '#FFFFFF',
  border: '1px solid #EBE5E0',
  borderRadius: '13px',
  boxShadow:
    '0 7px 20px rgba(62,36,69,0.05)'
};


const tituloCardStyle = {
  margin: '4px 0 14px',
  paddingBottom: '12px',
  borderBottom:
    '1px solid #F0EAE7',
  color: '#3E2445',
  fontFamily:
    "'Playfair Display', Georgia, serif",
  fontSize: '17px'
};


const statusStyle = {
  padding: '12px',
  marginBottom: '13px',
  background: '#FAF8F7',
  border: '1px solid #EEE7E3',
  borderRadius: '8px'
};


const statusLabelStyle = {
  display: 'block',
  marginBottom: '4px',
  color: '#91858E',
  fontSize: '9px'
};


const statusValorStyle = {
  color: '#6F5968',
  fontSize: '11px'
};


const linhaStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
  padding: '8px 0',
  borderBottom:
    '1px solid #F3EEEB'
};


const linhaLabelStyle = {
  color: '#91858E',
  fontSize: '9px'
};


const linhaValorStyle = {
  color: '#554C54',
  fontSize: '9px',
  fontWeight: '600',
  textAlign: 'right'
};


const acoesLateralStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '7px',
  marginTop: '14px'
};


const cardTopoStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
  alignItems: 'flex-start'
};


const botaoEditarStyle = {
  padding: 0,
  background: 'none',
  color: '#7A5B72',
  border: 'none',
  fontSize: '9px',
  fontWeight: '700',
  cursor: 'pointer'
};


const observacaoStyle = {
  marginTop: '13px',
  padding: '10px',
  background: '#FAF8F7',
  color: '#6E626A',
  borderRadius: '7px',
  fontSize: '9px',
  lineHeight: '1.5'
};


const botaoPrincipalStyle = {
  padding: '10px 18px',
  background: '#7A5B72',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontSize: '10px',
  fontWeight: '700',
  cursor: 'pointer'
};


const botaoPrincipalLargoStyle = {
  ...botaoPrincipalStyle,
  width: '100%',
  padding: '10px'
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


const botaoSecundarioLargoStyle = {
  ...botaoSecundarioStyle,
  width: '100%',
  padding: '10px'
};


const botaoAprovarStyle = {
  width: '100%',
  padding: '8px 10px',
  background: '#6F866A',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '6px',
  fontSize: '9px',
  fontWeight: '700',
  cursor: 'pointer'
};


const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  background:
    'rgba(49,35,47,0.44)'
};


const modalStyle = {
  width: 'min(440px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '25px',
  background: '#FFFFFF',
  border: '1px solid #EBE5E0',
  borderRadius: '14px',
  boxShadow:
    '0 18px 50px rgba(40,26,38,0.18)'
};


const tituloModalStyle = {
  margin: 0,
  color: '#3E2445',
  fontFamily:
    "'Playfair Display', Georgia, serif",
  fontSize: '21px'
};


const textoModalStyle = {
  margin: '6px 0 20px',
  color: '#91858E',
  fontSize: '10px',
  lineHeight: '1.5'
};


const campoStyle = {
  display: 'block',
  marginBottom: '13px',
  color: '#554C54',
  fontSize: '10px',
  fontWeight: '700'
};


const inputStyle = {
  width: '100%',
  marginTop: '5px',
  padding: '10px',
  boxSizing: 'border-box',
  color: '#4A424A',
  background: '#FFFFFF',
  border: '1px solid #DED6D1',
  borderRadius: '7px',
  outline: 'none',
  fontFamily:
    "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  fontSize: '10px'
};


const modalAcoesStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '20px'
};


const gridMedidasStyle = {
  display: 'grid',
  gridTemplateColumns:
    '1fr 1fr',
  gap: '0 12px'
};


export default Chat;