import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { parsePedidoDescricao } from '../utils/chatExport';

const jsonHeaders = { 'Content-Type': 'application/json' };

async function apiRequest(url, options = {}) {
  const res = await fetch(url, { headers: jsonHeaders, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.erro || data.error || 'Erro na requisição.');
  return data;
}

export function useChatPedido({ pedido, usuario, idCostureiraProp }) {
  const user = useMemo(
    () => usuario || JSON.parse(localStorage.getItem('usuarioAtelie') || '{}'),
    [usuario]
  );
  const idUsuario = user?.id_usuario || user?.id;
  const isCostureira = String(user?.tipo_usuario || user?.tipoUsuario || '').toLowerCase() === 'costureira';

  const paramsUrl = new URLSearchParams(window.location.search);
  const idPedido = pedido?.id || pedido?.id_pedido || pedido?.idPedido || Number(paramsUrl.get('pedido')) || null;

  const [mensagens, setMensagens] = useState([]);
  const [pedidoDados, setPedidoDados] = useState(pedido || {});
  const [descricaoPedido, setDescricaoPedido] = useState(pedido?.descricao || '');
  const [costureiraNome, setCostureiraNome] = useState('');
  const [clienteNome, setClienteNome] = useState(!isCostureira ? (user?.nome || '') : '');
  const [costureiraEndereco, setCostureiraEndereco] = useState(isCostureira ? (user?.endereco || '') : '');
  const [idCostureiraChat, setIdCostureiraChat] = useState(
    isCostureira
      ? idUsuario
      : (idCostureiraProp || pedido?.costureiraId || pedido?.id_costureira || Number(paramsUrl.get('costureira')) || null)
  );

  const [provaAgendada, setProvaAgendada] = useState(null);
  const [temProvaPendente, setTemProvaPendente] = useState(false);
  const [idOrdemServicoAvaliacao, setIdOrdemServicoAvaliacao] = useState(null);
  const [jaAvaliado, setJaAvaliado] = useState(false);
  const [statusPagamento, setStatusPagamento] = useState('Aguardando Sinal');
  const [medidas, setMedidas] = useState({ busto: '', cintura: '', quadril: '', observacoes_medidas: '' });
  const [orcamentoAtual, setOrcamentoAtual] = useState({
    total: 0,
    entrada: 0,
    prazo: '',
    horarioEntrega: '',
    status: pedido?.status_kanban || pedido?.status_pedido || pedido?.status || 'Aberto'
  });

  const pedidoDadosRef = useRef(pedidoDados);
  useEffect(() => { pedidoDadosRef.current = pedidoDados; }, [pedidoDados]);

  const carregandoMsgsRef = useRef(false);
  const usuarioBuscadoRef = useRef(new Set());
  const enviandoProvaRef = useRef(false);

  useEffect(() => {
    if (!pedido) return;
    if (pedido.descricao) setDescricaoPedido(pedido.descricao);
    setPedidoDados((prev) => ({
      ...prev,
      ...pedido,
      prazo_desejado: pedido.prazo_desejado || pedido.prazoDesejado || prev?.prazo_desejado || '',
      prazoDesejado: pedido.prazo_desejado || pedido.prazoDesejado || prev?.prazoDesejado || '',
      horario_limite: pedido.horario_limite || pedido.horarioLimite || prev?.horario_limite || '',
      horarioLimite: pedido.horario_limite || pedido.horarioLimite || prev?.horarioLimite || ''
    }));
  }, [pedido]);

  useEffect(() => {
    const idCost = isCostureira ? idUsuario : idCostureiraChat;
    if (!idCost) return;
    fetch(`/api/usuarios/${idCost}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.endereco) setCostureiraEndereco(data.endereco);
        if (data?.nome && !isCostureira) setCostureiraNome((prev) => prev || data.nome);
      })
      .catch(() => {});
  }, [isCostureira, idUsuario, idCostureiraChat]);

  const resolverParticipantes = useCallback(async (idCost, pedInfo = {}, msgsList = []) => {
    const pedAtual = pedidoDadosRef.current;
    const msgOutro = msgsList.find((m) => Number(m.id_remetente || m.idRemetente) !== Number(idUsuario));
    const nomeMsg = msgOutro?.remetente_nome || msgOutro?.nomeRemetente;

    if (isCostureira) {
      setCostureiraNome((prev) => prev || user?.nome || 'Profissional de Costura');
      const nomeCli = pedInfo?.clienteNome || pedInfo?.cliente_nome || pedAtual?.clienteNome || pedAtual?.cliente_nome || nomeMsg;
      if (nomeCli) return setClienteNome(nomeCli);

      const idCli = pedInfo?.clienteId || pedInfo?.id_cliente || pedAtual?.clienteId || pedAtual?.id_cliente;
      if (idCli && !usuarioBuscadoRef.current.has(`cli_${idCli}`)) {
        usuarioBuscadoRef.current.add(`cli_${idCli}`);
        fetch(`/api/usuarios/${idCli}`).then((r) => r.json()).then((d) => d?.nome && setClienteNome(d.nome)).catch(() => {});
      }
    } else {
      if (user?.nome) setClienteNome((prev) => prev || user.nome);
      const nomeCost = pedAtual?.costureiraNome || pedAtual?.costureira_nome || nomeMsg;
      if (nomeCost) return setCostureiraNome((prev) => prev || nomeCost);

      if (idCost && !usuarioBuscadoRef.current.has(`cost_${idCost}`)) {
        usuarioBuscadoRef.current.add(`cost_${idCost}`);
        fetch(`/api/usuarios/${idCost}`).then((r) => r.json()).then((d) => d?.nome && setCostureiraNome(d.nome)).catch(() => {});
      }
    }
  }, [isCostureira, user?.nome, idUsuario]);

  const carregarDadosPedido = useCallback(async (msgsAtuais = []) => {
    if (!idPedido) return;
    try {
      const [resPed, resAval, resPag] = await Promise.all([
        fetch(`/api/pedidos/${idPedido}`).catch(() => null),
        !isCostureira ? fetch(`/api/avaliacoes/pedido/${idPedido}`).catch(() => null) : Promise.resolve(null),
        fetch(`/api/ordens-servico/pedido/${idPedido}/pagamento`).catch(() => null)
      ]);

      const pedData = resPed?.ok ? await resPed.json() : null;
      if (pedData) {
        const prazo = pedData.prazo_desejado || pedData.prazoDesejado || '';
        const horario = pedData.horario_limite || pedData.horarioLimite || '';
        const nomeCli = pedData.clienteNome || pedData.cliente_nome || pedData.nomeCliente || '';

        setPedidoDados((prev) => ({
          ...prev,
          ...pedData,
          ...(nomeCli ? { clienteNome: nomeCli, cliente_nome: nomeCli } : {}),
          prazo_desejado: prazo || prev?.prazo_desejado || '',
          prazoDesejado: prazo || prev?.prazoDesejado || '',
          horario_limite: horario || prev?.horario_limite || '',
          horarioLimite: horario || prev?.horarioLimite || ''
        }));

        const statusReal = pedData.status_kanban || pedData.status_pedido || pedData.status;
        if (statusReal) setOrcamentoAtual((prev) => ({ ...prev, status: statusReal }));
        if (pedData.descricao) setDescricaoPedido((prev) => prev || pedData.descricao);
      }

      resolverParticipantes(idCostureiraChat, pedData || {}, msgsAtuais);

      if (resAval?.ok) {
        const avalData = await resAval.json();
        if (avalData.id_ordem_servico) setIdOrdemServicoAvaliacao(avalData.id_ordem_servico);
        setJaAvaliado(Boolean(avalData.avaliado));
      }

      if (resPag?.ok) {
        const pagData = await resPag.json();
        if (pagData.possui_os) {
          if (pagData.status_pagamento) setStatusPagamento(pagData.status_pagamento);
          setOrcamentoAtual((prev) => ({
            ...prev,
            total: pagData.valor_total || prev.total,
            entrada: pagData.valor_entrada ?? prev.entrada
          }));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do pedido:', err);
    }
  }, [idPedido, isCostureira, idCostureiraChat, resolverParticipantes]);

  const carregarMensagens = useCallback(async (silencioso = false, atualizarPedidoTambem = false) => {
    if (!idPedido || (silencioso && carregandoMsgsRef.current)) return;
    carregandoMsgsRef.current = true;
    try {
      const params = new URLSearchParams();
      if (idCostureiraChat) params.append('id_costureira', idCostureiraChat);
      if (idUsuario) params.append('id_usuario', idUsuario);

      const res = await fetch(`/api/mensagens-chat/${idPedido}?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;

      let houveMudanca = false;
      setMensagens((prev) => {
        const uPrev = prev[prev.length - 1];
        const uNova = data[data.length - 1];
        if (
          prev.length === data.length &&
          (uPrev?.id_mensagem || uPrev?.id) === (uNova?.id_mensagem || uNova?.id) &&
          JSON.stringify(uPrev?.dados_proposta) === JSON.stringify(uNova?.dados_proposta)
        ) {
          return prev;
        }
        houveMudanca = true;
        return data;
      });

      if (!silencioso || houveMudanca) {
        window.dispatchEvent(new Event('notificacoesAtualizadas'));

        const reverso = [...data].reverse();
        const propOrc = reverso.find((m) => m.tipo_mensagem === 'proposta' || m.conteudo?.includes('Proposta de Orçamento:'));
        let costId = idCostureiraChat;

        if (propOrc) {
          const dados = typeof propOrc.dados_proposta === 'string' ? JSON.parse(propOrc.dados_proposta || '{}') : (propOrc.dados_proposta || {});
          if (dados.idCostureira) {
            costId = dados.idCostureira;
            if (!idCostureiraChat) setIdCostureiraChat(dados.idCostureira);
          }
          setOrcamentoAtual((prev) => ({
            ...prev,
            total: dados.valorTotal || propOrc.valorProposta || 0,
            entrada: dados.valorEntrada || propOrc.valorEntrada || 0,
            prazo: dados.previsaoEntrega || '',
            horarioEntrega: dados.horarioEntrega || ''
          }));
        }

        const propProva = reverso.find((m) => m.tipo_mensagem === 'proposta_prova' || m.conteudo?.includes('Proposta de Agendamento de Prova:'));
        if (propProva) {
          const dProva = typeof propProva.dados_proposta === 'string' ? JSON.parse(propProva.dados_proposta || '{}') : (propProva.dados_proposta || {});
          const st = dProva.status || 'pendente';
          setProvaAgendada(st === 'aceita' ? {
            dataProva: dProva.dataProva || '',
            horarioProva: dProva.horarioProva || '',
            semPreferenciaHorario: Boolean(dProva.semPreferenciaHorario),
            local: dProva.local || '',
            observacao: dProva.observacao || ''
          } : null);
          setTemProvaPendente(st === 'pendente');
        } else {
          setProvaAgendada(null);
          setTemProvaPendente(false);
        }

        resolverParticipantes(costId, {}, data);
        if (atualizarPedidoTambem || (silencioso && houveMudanca)) carregarDadosPedido(data);
      } else if (atualizarPedidoTambem) {
        carregarDadosPedido(data);
      }
    } finally {
      carregandoMsgsRef.current = false;
    }
  }, [idPedido, idCostureiraChat, idUsuario, resolverParticipantes, carregarDadosPedido]);

  const carregarRef = useRef(carregarMensagens);
  useEffect(() => { carregarRef.current = carregarMensagens; }, [carregarMensagens]);

  useEffect(() => {
    if (!idPedido) return;
    carregarRef.current(false, true);

    const interval = setInterval(() => {
      if (!document.hidden) {
        carregarRef.current(true, false);
      }
    }, 6000);

    const handleVisibility = () => {
      if (!document.hidden) {
        carregarRef.current(true, false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [idPedido, idCostureiraChat]);

  const idClienteMedidas = isCostureira ? (pedidoDados?.clienteId || pedidoDados?.id_cliente) : idUsuario;
  useEffect(() => {
    if (!idClienteMedidas) return;
    fetch(`/api/usuarios/${idClienteMedidas}/medidas`)
      .then((r) => r.json())
      .then((d) => d && !d.erro && setMedidas({
        busto: d.busto || '',
        cintura: d.cintura || '',
        quadril: d.quadril || '',
        observacoes_medidas: d.observacoes_medidas || ''
      }))
      .catch(() => {});
  }, [idClienteMedidas]);

  const temPropostaAtiva = useMemo(() => {
    return mensagens.some((m) => {
      if (m.tipo_mensagem !== 'proposta') return false;
      const d = typeof m.dados_proposta === 'string' ? JSON.parse(m.dados_proposta || '{}') : (m.dados_proposta || {});
      const st = String(d.status || 'pendente').toLowerCase();
      return st !== 'recusada' && st !== 'cancelada';
    });
  }, [mensagens]);

  const enviarMensagem = async (texto, anexo_imagem = null) => {
    if (!texto && !anexo_imagem) return;
    try {
      await apiRequest('/api/mensagens-chat', {
        method: 'POST',
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_remetente: Number(idUsuario),
          id_costureira: Number(idCostureiraChat),
          conteudo: texto || '',
          anexo_imagem,
          tipo_mensagem: anexo_imagem ? 'imagem' : 'texto'
        })
      });
      carregarMensagens(false, false);
    } catch (err) {
      alert(err.message);
    }
  };

  const enviarProposta = async (dadosForm) => {
    const total = parseFloat(dadosForm.valorTotal.replace(/[^\d,]/g, '').replace(',', '.'));
    const entrada = parseFloat(dadosForm.valorEntrada.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const dataFormatada = new Date(dadosForm.previsaoEntrega + 'T12:00:00').toLocaleDateString('pt-BR');
    const conteudo = `Proposta de Orçamento:\nServiço: ${dadosForm.tipoServico}\nDescrição: ${dadosForm.descricao}\nValor Total: R$ ${total.toFixed(2)}${entrada > 0 ? `\nEntrada (Sinal): R$ ${entrada.toFixed(2)}` : ''}\nPrevisão de Entrega: ${dataFormatada} às ${dadosForm.horarioEntrega}`;

    await apiRequest('/api/mensagens-chat', {
      method: 'POST',
      body: JSON.stringify({
        id_pedido: Number(idPedido),
        id_remetente: Number(idUsuario),
        id_costureira: Number(idCostureiraChat),
        conteudo,
        tipo_mensagem: 'proposta',
        valor_entrada: entrada,
        valor_proposta: total,
        dados_proposta: { ...dadosForm, valorTotal: total, valorEntrada: entrada, idCostureira: idCostureiraChat, status: 'pendente' }
      })
    });
    carregarMensagens(false, true);
  };

  const enviarPropostaProva = async (dadosForm) => {
    if (enviandoProvaRef.current || temProvaPendente || orcamentoAtual.status === 'Aguardando Prova') {
      return;
    }

    enviandoProvaRef.current = true;
    try {
      const [ano, mes, dia] = dadosForm.dataProva.split('-');
      const obs = (dadosForm.observacao || '').trim();
      const conteudo = `Proposta de Agendamento de Prova:\nData: ${dia}/${mes}/${ano}\nHorário: ${dadosForm.horarioProva}\nLocal: ${dadosForm.local}${obs ? `\nObservações: ${obs}` : ''}`;

      await apiRequest('/api/mensagens-chat', {
        method: 'POST',
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_remetente: Number(idUsuario),
          id_costureira: Number(idCostureiraChat),
          conteudo,
          tipo_mensagem: 'proposta_prova',
          dados_proposta: { ...dadosForm, idCostureira: idCostureiraChat, status: 'pendente' }
        })
      });
      setTemProvaPendente(true);
      await carregarMensagens(false, true);
    } finally {
      enviandoProvaRef.current = false;
    }
  };

  const aceitarProva = async (idMensagem, dadosProva, idRemetenteProva) => {
    try {
      await apiRequest('/api/ordens-servico/aceitar-prova', {
        method: 'POST',
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_mensagem: Number(idMensagem),
          id_cliente: Number(idUsuario),
          id_costureira: Number(dadosProva.idCostureira || idRemetenteProva || idCostureiraChat),
          dataProva: dadosProva.dataProva,
          horarioProva: dadosProva.horarioProva,
          observacao: dadosProva.observacao,
          local: dadosProva.local
        })
      });
      setProvaAgendada({ ...dadosProva, local: dadosProva.local || costureiraEndereco || '' });
      setTemProvaPendente(false);
      setOrcamentoAtual((prev) => ({ ...prev, status: 'Aguardando Prova' }));
      carregarMensagens(false, true);
    } catch (err) {
      alert(err.message);
    }
  };

  const recusarProva = async (idMensagem, idRemetenteProva) => {
    if (!window.confirm('Deseja recusar esta data/horário de prova?')) return;
    try {
      await apiRequest('/api/ordens-servico/recusar-prova', {
        method: 'POST',
        body: JSON.stringify({ id_pedido: Number(idPedido), id_mensagem: Number(idMensagem), id_costureira: Number(idRemetenteProva || idCostureiraChat) })
      });
      setTemProvaPendente(false);
      carregarMensagens(false, true);
    } catch (err) {
      alert(err.message);
    }
  };

  const cancelarProva = async (observacao = '') => {
    await apiRequest('/api/ordens-servico/cancelar-prova', {
      method: 'POST',
      body: JSON.stringify({ id_pedido: Number(idPedido), id_remetente: Number(idUsuario), observacao })
    });
    setProvaAgendada(null);
    setTemProvaPendente(false);
    setOrcamentoAtual((prev) => ({ ...prev, status: 'Em Produção' }));
    carregarMensagens(false, true);
  };

  const aceitarProposta = async (dadosProposta, idRemetenteProposta) => {
    await apiRequest('/api/ordens-servico/aceitar-proposta', {
      method: 'POST',
      body: JSON.stringify({
        id_pedido: Number(idPedido),
        id_costureira: Number(dadosProposta.idCostureira || idRemetenteProposta || idCostureiraChat),
        valor_total: dadosProposta.valorTotal || orcamentoAtual.total,
        valor_entrada: dadosProposta.valorEntrada || orcamentoAtual.entrada,
        previsao_entrega: dadosProposta.previsaoEntrega || orcamentoAtual.prazo
      })
    });
    setOrcamentoAtual((prev) => ({ ...prev, status: 'Em Produção' }));
    carregarMensagens(false, true);
  };

  const recusarProposta = async (idMensagem, idRemetenteProposta) => {
    if (!window.confirm('Deseja recusar esta proposta?')) return;
    try {
      await apiRequest('/api/ordens-servico/recusar-proposta', {
        method: 'POST',
        body: JSON.stringify({ id_pedido: Number(idPedido), id_mensagem: Number(idMensagem), id_costureira: Number(idRemetenteProposta || idCostureiraChat) })
      });
      carregarMensagens(false, true);
    } catch (err) {
      alert(err.message);
    }
  };

  const concluirServico = async () => {
    if (!window.confirm('Confirma que a peça está pronta?')) return;
    try {
      await apiRequest('/api/ordens-servico/concluir', {
        method: 'POST',
        body: JSON.stringify({ id_pedido: Number(idPedido), id_costureira: Number(idCostureiraChat) })
      });
      alert('Peça concluída! O/a cliente foi notificado(a).');
      setOrcamentoAtual((prev) => ({ ...prev, status: 'Concluído' }));
      carregarMensagens(false, true);
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmarEntrega = async () => {
    const data = await apiRequest('/api/ordens-servico/confirmar-entrega', {
      method: 'POST',
      body: JSON.stringify({ id_pedido: Number(idPedido), id_cliente: Number(idUsuario) })
    });
    setIdOrdemServicoAvaliacao(data.id_ordem_servico);
    setOrcamentoAtual((prev) => ({ ...prev, status: 'Entregue' }));
    carregarMensagens(false, true);
    return data;
  };

  const cancelarPedido = async (observacao = '') => {
    await apiRequest('/api/pedidos/cancelar', {
      method: 'POST',
      body: JSON.stringify({ id_pedido: Number(idPedido), id_usuario: Number(idUsuario), observacao })
    });
    setOrcamentoAtual((prev) => ({ ...prev, status: 'Cancelado' }));
    carregarMensagens(false, true);
  };

  const alterarPagamento = async (novoStatusPagamento) => {
    try {
      await apiRequest(`/api/ordens-servico/pedido/${idPedido}/pagamento`, {
        method: 'PUT',
        body: JSON.stringify({ status_pagamento: novoStatusPagamento, id_costureira: Number(idCostureiraChat || idUsuario) })
      });
      setStatusPagamento(novoStatusPagamento);
      carregarMensagens(false, true);
    } catch (err) {
      alert(err.message);
    }
  };

  const salvarMedidas = async (novasMedidas) => {
    const idAlvo = idClienteMedidas || pedidoDados?.clienteId || pedidoDados?.id_cliente || (!isCostureira ? idUsuario : null);
    if (!idAlvo) {
      throw new Error('Não foi possível identificar o cliente para salvar as medidas.');
    }

    const payload = {
      busto: novasMedidas.busto || '',
      cintura: novasMedidas.cintura || '',
      quadril: novasMedidas.quadril || '',
      observacoes_medidas: novasMedidas.observacoes_medidas || ''
    };

    await apiRequest(`/api/usuarios/${idAlvo}/medidas`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    setMedidas(payload);

    if (!isCostureira && Number(idAlvo) === Number(idUsuario)) {
      const salvo = JSON.parse(localStorage.getItem('usuarioAtelie') || '{}');
      localStorage.setItem('usuarioAtelie', JSON.stringify({ ...salvo, ...payload }));
    }
  };

  const infoDesc = parsePedidoDescricao(descricaoPedido);

  return {
    user,
    idUsuario,
    isCostureira,
    idPedido,
    mensagens,
    pedidoDados,
    infoDesc,
    tituloChat: descricaoPedido ? `${infoDesc.tipo}${infoDesc.descricao ? ` - ${infoDesc.descricao}` : ''}` : `Pedido #${idPedido}`,
    costureiraNome,
    clienteNome,
    costureiraEndereco,
    idCostureiraChat,
    orcamentoAtual,
    statusPagamento,
    medidas,
    jaAvaliado,
    setJaAvaliado,
    idOrdemServicoAvaliacao,
    temProvaPendente,
    temPropostaAtiva,
    provaComLocalFallback: provaAgendada ? { ...provaAgendada, local: provaAgendada.local || costureiraEndereco || '' } : null,
    acoes: {
      enviarMensagem,
      enviarProposta,
      enviarPropostaProva,
      aceitarProva,
      recusarProva,
      cancelarProva,
      aceitarProposta,
      recusarProposta,
      concluirServico,
      confirmarEntrega,
      cancelarPedido,
      alterarPagamento,
      salvarMedidas
    }
  };
}