import React, { useState, useEffect, useCallback } from 'react';
import ModalCancelarPedido from './modals/ModalCancelarPedido';
import ModalAceitarProposta from './modals/ModalAceitarProposta';
import ModalConfirmarEntrega from './modals/ModalConfirmarEntrega';
import ModalCancelarProva from './modals/ModalCancelarProva';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatSidebar from './ChatSidebar';
import ModalProposta from './modals/ModalProposta';
import ModalProva from './modals/ModalProva';
import ModalMedidas from './modals/ModalMedidas';
import ModalAvaliacao from './modals/ModalAvaliacao';
import { parsePedidoDescricao } from './utils/chatExport';

function ChatContainer({ pedido, usuario, idCostureiraProp, onNavigate }) {
  const user = usuario || JSON.parse(localStorage.getItem('usuarioAtelie') || '{}');
  const idUsuario = user?.id_usuario || user?.id;
  const isCostureira = (user?.tipo_usuario || user?.tipoUsuario || '').toString().toLowerCase() === 'costureira';

  const paramsUrl = new URLSearchParams(window.location.search);
  const idPedidoUrl = paramsUrl.get('pedido');
  const idCostureiraUrl = paramsUrl.get('costureira');

  const idPedido = pedido?.id || pedido?.id_pedido || pedido?.idPedido || (idPedidoUrl ? Number(idPedidoUrl) : null);

  const [mensagens, setMensagens] = useState([]);
  const [descricaoPedido, setDescricaoPedido] = useState(pedido?.descricao || '');
  const [pedidoDados, setPedidoDados] = useState(pedido || {});

  useEffect(() => {
    if (pedido) {
      setPedidoDados((prev) => ({
        ...prev,
        ...pedido,
        prazo_desejado: pedido.prazo_desejado || pedido.prazoDesejado || prev?.prazo_desejado || '',
        prazoDesejado: pedido.prazo_desejado || pedido.prazoDesejado || prev?.prazoDesejado || '',
        horario_limite: pedido.horario_limite || pedido.horarioLimite || prev?.horario_limite || '',
        horarioLimite: pedido.horario_limite || pedido.horarioLimite || prev?.horarioLimite || ''
      }));
    }
  }, [pedido]);

  const [costureiraNome, setCostureiraNome] = useState('');
  const [costureiraEndereco, setCostureiraEndereco] = useState(isCostureira ? (user?.endereco || '') : '');
  const [idCostureiraChat, setIdCostureiraChat] = useState(
    isCostureira
      ? idUsuario
      : (idCostureiraProp || pedido?.costureiraId || pedido?.id_costureira || (idCostureiraUrl ? Number(idCostureiraUrl) : null))
  );

  // Modais e controle de avaliação / prova
  const [mostrarProposta, setMostrarProposta] = useState(false);
  const [mostrarProva, setMostrarProva] = useState(false);
  const [provaAgendada, setProvaAgendada] = useState(null);
  const [temProvaPendente, setTemProvaPendente] = useState(false);
  const [mostrarCancelarProva, setMostrarCancelarProva] = useState(false);
  const [cancelandoProva, setCancelandoProva] = useState(false);
  const [mostrarMedidas, setMostrarMedidas] = useState(false);
  const [mostrarAvaliacao, setMostrarAvaliacao] = useState(false);
  const [mostrarCancelar, setMostrarCancelar] = useState(false);
  const [cancelandoPedido, setCancelandoPedido] = useState(false);
  const [propostaParaAceitar, setPropostaParaAceitar] = useState(null);
  const [aceitandoProposta, setAceitandoProposta] = useState(false);
  const [mostrarConfirmarEntrega, setMostrarConfirmarEntrega] = useState(false);
  const [confirmandoEntrega, setConfirmandoEntrega] = useState(false);
  const [idOrdemServicoAvaliacao, setIdOrdemServicoAvaliacao] = useState(null);
  const [jaAvaliado, setJaAvaliado] = useState(false);

  const [orcamentoAtual, setOrcamentoAtual] = useState({
    total: 0,
    entrada: 0,
    prazo: '',
    horarioEntrega: '',
    status: pedido?.status_kanban || pedido?.status_pedido || pedido?.status || 'Aberto'
  });

  const [medidas, setMedidas] = useState({ busto: '', cintura: '', quadril: '', observacoes_medidas: '' });

  useEffect(() => {
    if (pedido?.descricao) {
      setDescricaoPedido(pedido.descricao);
    }
  }, [pedido?.descricao]);

  const infoDesc = parsePedidoDescricao(descricaoPedido);
  const tituloChat = descricaoPedido
    ? `${infoDesc.tipo}${infoDesc.descricao ? ` - ${infoDesc.descricao}` : ''}`
    : `Pedido #${idPedido}`;

  // Busca endereço atualizado da costureira no banco
  useEffect(() => {
    const idCost = isCostureira ? idUsuario : idCostureiraChat;
    if (!idCost) return;

    fetch(`/api/usuarios/${idCost}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.endereco) {
          setCostureiraEndereco(data.endereco);
        }
        if (data?.nome && !isCostureira) {
          setCostureiraNome((prev) => prev || data.nome);
        }
      })
      .catch(() => {});
  }, [isCostureira, idUsuario, idCostureiraChat]);

  // RESOLUÇÃO ROBUSTA DO NOME DA COSTUREIRA
  const resolverNomeCostureira = useCallback(async (idCost, msgsList = []) => {
    if (isCostureira) {
      setCostureiraNome(user?.nome || 'Costureira');
      return;
    }

    const nomeSalvo = pedidoDados?.costureiraNome || pedidoDados?.costureira_nome || pedido?.costureiraNome || pedido?.costureira_nome;
    if (nomeSalvo) {
      setCostureiraNome(nomeSalvo);
      return;
    }

    const msgOutro = msgsList.find(
      (m) => Number(m.id_remetente || m.idRemetente) !== Number(idUsuario)
    );
    if (msgOutro && (msgOutro.remetente_nome || msgOutro.nomeRemetente)) {
      setCostureiraNome(msgOutro.remetente_nome || msgOutro.nomeRemetente);
      return;
    }

    if (idCost) {
      try {
        const res = await fetch(`/api/usuarios/${idCost}`);
        const data = await res.json();
        if (data && data.nome) {
          setCostureiraNome(data.nome);
        }
      } catch (err) {
        console.error('Erro ao buscar nome da costureira:', err);
      }
    }
  }, [isCostureira, user?.nome, pedidoDados?.costureiraNome, pedidoDados?.costureira_nome, pedido, idUsuario]);

  // CARREGAMENTO DAS MENSAGENS E DADOS DO CHAT (INICIAL E SILENCIOSO)
  const carregarMensagens = useCallback(async (silencioso = false) => {
    if (!idPedido) return;
    try {
      const params = new URLSearchParams();
      if (idCostureiraChat) params.append('id_costureira', idCostureiraChat);
      if (idUsuario) params.append('id_usuario', idUsuario);
      const queryString = params.toString();
      const url = `/api/mensagens-chat/${idPedido}${queryString ? `?${queryString}` : ''}`;

      const [resMsgs, resPed, resAval] = await Promise.all([
        fetch(url),
        fetch(`/api/pedidos/${idPedido}`).catch(() => null),
        !isCostureira ? fetch(`/api/avaliacoes/pedido/${idPedido}`).catch(() => null) : Promise.resolve(null)
      ]);

      if (resMsgs.ok) {
        const data = await resMsgs.json();
        if (Array.isArray(data)) {
          let houveMudanca = false;
          setMensagens((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(data)) {
              return prev;
            }
            houveMudanca = true;
            return data;
          });

          if (!silencioso || houveMudanca) {
            window.dispatchEvent(new Event('notificacoesAtualizadas'));
          }

          const propostaExistente = [...data].reverse().find(
            (m) => m.tipo_mensagem === 'proposta' || (m.conteudo && m.conteudo.includes('Proposta de Orçamento:'))
          );

          let costureiraIdIdentificado = idCostureiraChat;

          if (propostaExistente) {
            let dados = propostaExistente.dados_proposta || {};
            if (typeof dados === 'string') {
              try { dados = JSON.parse(dados); } catch { dados = {}; }
            }

            if (dados.idCostureira) {
              costureiraIdIdentificado = dados.idCostureira;
              if (!idCostureiraChat) setIdCostureiraChat(dados.idCostureira);
            }

            setOrcamentoAtual((prev) => ({
              ...prev,
              total: dados.valorTotal || propostaExistente.valorProposta || 0,
              entrada: dados.valorEntrada || propostaExistente.valorEntrada || 0,
              prazo: dados.previsaoEntrega || '',
              horarioEntrega: dados.horarioEntrega || ''
            }));
          }

          // Sincroniza estado da última proposta de prova
          const ultimaPropostaProva = [...data].reverse().find(
            (m) => m.tipo_mensagem === 'proposta_prova' || (m.conteudo && m.conteudo.includes('Proposta de Agendamento de Prova:'))
          );

          if (ultimaPropostaProva) {
            let dadosProvaMsg = ultimaPropostaProva.dados_proposta || {};
            if (typeof dadosProvaMsg === 'string') {
              try { dadosProvaMsg = JSON.parse(dadosProvaMsg); } catch { dadosProvaMsg = {}; }
            }
            const statusProvaMsg = dadosProvaMsg.status || 'pendente';

            if (statusProvaMsg === 'aceita') {
              setProvaAgendada({
                dataProva: dadosProvaMsg.dataProva || '',
                horarioProva: dadosProvaMsg.horarioProva || '',
                semPreferenciaHorario: Boolean(dadosProvaMsg.semPreferenciaHorario),
                local: dadosProvaMsg.local || '',
                observacao: dadosProvaMsg.observacao || ''
              });
              setTemProvaPendente(false);
            } else if (statusProvaMsg === 'pendente') {
              setProvaAgendada(null);
              setTemProvaPendente(true);
            } else {
              setProvaAgendada(null);
              setTemProvaPendente(false);
            }
          } else {
            setProvaAgendada(null);
            setTemProvaPendente(false);
          }

          resolverNomeCostureira(costureiraIdIdentificado, data);
        }
      } else if (!silencioso) {
        console.error('Erro HTTP ao carregar mensagens:', resMsgs.status);
      }

      let pedData = null;
      if (resPed && resPed.ok) {
        pedData = await resPed.json();
      } else {
        // Fallback caso a rota GET /api/pedidos/:id não esteja mapeada
        const resTodos = await fetch('/api/pedidos').catch(() => null);
        if (resTodos && resTodos.ok) {
          const lista = await resTodos.json();
          if (Array.isArray(lista)) {
            pedData = lista.find((p) => Number(p.id_pedido || p.id) === Number(idPedido)) || null;
          }
        }
      }

      if (pedData) {
        const prazoEncontrado = pedData.prazo_desejado || pedData.prazoDesejado || '';
        const horarioEncontrado = pedData.horario_limite || pedData.horarioLimite || '';
        setPedidoDados((prev) => ({
          ...prev,
          ...pedData,
          prazo_desejado: prazoEncontrado || prev?.prazo_desejado || '',
          prazoDesejado: prazoEncontrado || prev?.prazoDesejado || '',
          horario_limite: horarioEncontrado || prev?.horario_limite || '',
          horarioLimite: horarioEncontrado || prev?.horarioLimite || ''
        }));
        const statusReal = pedData.status_kanban || pedData.status_pedido || pedData.status;
        if (statusReal) setOrcamentoAtual((prev) => ({ ...prev, status: statusReal }));
        if (pedData.descricao) setDescricaoPedido((prev) => prev || pedData.descricao);
      }

      if (resAval && resAval.ok) {
        const avalData = await resAval.json();
        if (avalData.id_ordem_servico) {
          setIdOrdemServicoAvaliacao(avalData.id_ordem_servico);
        }
        setJaAvaliado(Boolean(avalData.avaliado));
      }
    } catch (err) {
      if (!silencioso) console.error('Erro ao carregar chat:', err);
    }
  }, [idPedido, idCostureiraChat, idUsuario, isCostureira, resolverNomeCostureira]);

  // Carga inicial + polling silencioso a cada 5 segundos
  useEffect(() => {
    carregarMensagens(false);

    const intervalo = setInterval(() => {
      carregarMensagens(true);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [carregarMensagens]);

  // Carrega Ficha de Medidas do Cliente
  useEffect(() => {
    const targetId = isCostureira ? (pedidoDados?.clienteId || pedidoDados?.id_cliente) : idUsuario;
    if (targetId) {
      fetch(`/api/usuarios/${targetId}/medidas`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.erro) {
            setMedidas({
              busto: data.busto || '',
              cintura: data.cintura || '',
              quadril: data.quadril || '',
              observacoes_medidas: data.observacoes_medidas || ''
            });
          }
        })
        .catch(() => {});
    }
  }, [isCostureira, pedidoDados?.clienteId, pedidoDados?.id_cliente, idUsuario]);

  const handleEnviarMensagem = async (texto, imagemBase64 = null) => {
    if (!texto && !imagemBase64) return;
    try {
      const res = await fetch('/api/mensagens-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_remetente: Number(idUsuario),
          id_costureira: Number(idCostureiraChat),
          conteudo: texto || '',
          anexo_imagem: imagemBase64 || null,
          tipo_mensagem: imagemBase64 ? 'imagem' : 'texto'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || data.erro || 'Não foi possível enviar a mensagem/foto.');
        return;
      }
      carregarMensagens(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEnviarPropostaModal = async (dadosForm) => {
    const total = parseFloat(dadosForm.valorTotal.replace(/[^\d,]/g, '').replace(',', '.'));
    const entrada = parseFloat(dadosForm.valorEntrada.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const dataFormatada = new Date(dadosForm.previsaoEntrega + 'T12:00:00').toLocaleDateString('pt-BR');

    const textoFormatado = `Proposta de Orçamento:\nServiço: ${dadosForm.tipoServico}\nDescrição: ${dadosForm.descricao}\nValor Total: R$ ${total.toFixed(2)}${entrada > 0 ? `\nEntrada (Sinal): R$ ${entrada.toFixed(2)}` : ''}\nPrevisão de Entrega: ${dataFormatada} às ${dadosForm.horarioEntrega}`;

    try {
      const res = await fetch('/api/mensagens-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_remetente: Number(idUsuario),
          id_costureira: Number(idCostureiraChat),
          conteudo: textoFormatado,
          tipo_mensagem: 'proposta',
          valor_entrada: entrada,
          valor_proposta: total,
          dados_proposta: { ...dadosForm, valorTotal: total, valorEntrada: entrada, idCostureira: idCostureiraChat, status: 'pendente' }
        })
      });

      if (res.ok) {
        setMostrarProposta(false);
        carregarMensagens(false);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEnviarPropostaProva = async (dadosForm) => {
    const [ano, mes, dia] = dadosForm.dataProva.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const horarioTexto = dadosForm.horarioProva;
    const obsTexto = (dadosForm.observacao || '').trim();

    const textoFormatado =
      `Proposta de Agendamento de Prova:\n` +
      `Data: ${dataFormatada}\n` +
      `Horário: ${horarioTexto}\n` +
      `Local: ${dadosForm.local}` +
      (obsTexto ? `\nObservações: ${obsTexto}` : '');

    try {
      const res = await fetch('/api/mensagens-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_remetente: Number(idUsuario),
          id_costureira: Number(idCostureiraChat),
          conteudo: textoFormatado,
          tipo_mensagem: 'proposta_prova',
          dados_proposta: {
            ...dadosForm,
            idCostureira: idCostureiraChat,
            status: 'pendente'
          }
        })
      });

      if (res.ok) {
        setMostrarProva(false);
        setTemProvaPendente(true);
        carregarMensagens(false);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAceitarProva = async (idMensagem, dadosProva, idRemetenteProva) => {
    try {
      const res = await fetch('/api/ordens-servico/aceitar-prova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (res.ok) {
        setProvaAgendada({
          dataProva: dadosProva.dataProva || '',
          horarioProva: dadosProva.horarioProva || '',
          local: dadosProva.local || costureiraEndereco || '',
          observacao: dadosProva.observacao || ''
        });
        setTemProvaPendente(false);
        setOrcamentoAtual((prev) => ({ ...prev, status: 'Aguardando Prova' }));
        carregarMensagens(false);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRecusarProva = async (idMensagem, idRemetenteProva) => {
    if (!window.confirm('Deseja recusar esta data/horário de prova?')) return;
    try {
      const res = await fetch('/api/ordens-servico/recusar-prova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_mensagem: Number(idMensagem),
          id_costureira: Number(idRemetenteProva || idCostureiraChat)
        })
      });
      if (res.ok) {
        setTemProvaPendente(false);
        carregarMensagens(false);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelarProva = async (observacao = '') => {
    setCancelandoProva(true);
    try {
      const res = await fetch('/api/ordens-servico/cancelar-prova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_remetente: Number(idUsuario),
          observacao
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.erro || data.error || 'Erro ao cancelar prova.');
      }

      setProvaAgendada(null);
      setTemProvaPendente(false);
      setOrcamentoAtual((prev) => ({ ...prev, status: 'Em Produção' }));
      setMostrarCancelarProva(false);
      carregarMensagens(false);
    } finally {
      setCancelandoProva(false);
    }
  };

  const handleAbrirModalAceitarProposta = (dadosProposta, idRemetenteProposta) => {
    setPropostaParaAceitar({
      dadosProposta,
      idRemetenteProposta: idRemetenteProposta || idCostureiraChat
    });
  };

  const handleConfirmarAceiteProposta = async () => {
    if (!propostaParaAceitar) return;
    const { dadosProposta, idRemetenteProposta } = propostaParaAceitar;

    setAceitandoProposta(true);
    try {
      const res = await fetch('/api/ordens-servico/aceitar-proposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_costureira: Number(dadosProposta.idCostureira || idRemetenteProposta || idCostureiraChat),
          valor_total: dadosProposta.valorTotal || orcamentoAtual.total,
          valor_entrada: dadosProposta.valorEntrada || orcamentoAtual.entrada,
          previsao_entrega: dadosProposta.previsaoEntrega || orcamentoAtual.prazo
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.erro || 'Não foi possível aprovar o orçamento.');
      }

      setOrcamentoAtual((prev) => ({ ...prev, status: 'Em Produção' }));
      setPropostaParaAceitar(null);
      carregarMensagens(false);
    } finally {
      setAceitandoProposta(false);
    }
  };

  const handleRecusarProposta = async (idMensagem, idRemetenteProposta) => {
    if (!window.confirm('Deseja recusar esta proposta?')) return;
    try {
      const res = await fetch('/api/ordens-servico/recusar-proposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_mensagem: Number(idMensagem),
          id_costureira: Number(idRemetenteProposta || idCostureiraChat)
        })
      });
      if (res.ok) carregarMensagens(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConcluirServico = async () => {
    if (!window.confirm('Confirma que a peça está pronta?')) return;
    try {
      const res = await fetch('/api/ordens-servico/concluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pedido: Number(idPedido), id_costureira: Number(idCostureiraChat) })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.erro || data.error || 'Não foi possível concluir a peça.');
        return;
      }
      alert('Peça concluída! Cliente notificado.');
      setOrcamentoAtual((prev) => ({ ...prev, status: 'Concluído' }));
      carregarMensagens(false);
    } catch (err) { alert(err.message); }
  };

  const handleConfirmarEntrega = async () => {
    setConfirmandoEntrega(true);
    try {
      const res = await fetch('/api/ordens-servico/confirmar-entrega', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pedido: Number(idPedido), id_cliente: Number(idUsuario) })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.erro || 'Não foi possível confirmar o recebimento.');
      }
      setIdOrdemServicoAvaliacao(data.id_ordem_servico);
      setOrcamentoAtual((prev) => ({ ...prev, status: 'Entregue' }));
      setMostrarConfirmarEntrega(false);
      carregarMensagens(false);
      setMostrarAvaliacao(true);
    } finally {
      setConfirmandoEntrega(false);
    }
  };

  const handleCancelarPedido = async (observacao = '') => {
    setCancelandoPedido(true);
    try {
      const res = await fetch('/api/pedidos/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_usuario: Number(idUsuario),
          observacao
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.erro || 'Erro ao cancelar pedido.');
      }
      setOrcamentoAtual((prev) => ({ ...prev, status: 'Cancelado' }));
      setMostrarCancelar(false);
      carregarMensagens(false);
    } finally {
      setCancelandoPedido(false);
    }
  };

  const idCostureiraPerfil =
    propostaParaAceitar?.dadosProposta?.idCostureira ||
    propostaParaAceitar?.idRemetenteProposta ||
    idCostureiraChat;

  const prazoSolicitadoCliente =
    pedidoDados?.prazo_desejado ||
    pedidoDados?.prazoDesejado ||
    pedido?.prazo_desejado ||
    pedido?.prazoDesejado ||
    '';

  const horarioLimiteCliente =
    pedidoDados?.horario_limite ||
    pedidoDados?.horarioLimite ||
    pedido?.horario_limite ||
    pedido?.horarioLimite ||
    '';

  const provaComLocalFallback = provaAgendada
    ? { ...provaAgendada, local: provaAgendada.local || costureiraEndereco || '' }
    : null;

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '0 12px', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <ChatHeader
        nomeUsuario={user?.nome}
        fotoPerfil={user?.foto_perfil}
        isCostureira={isCostureira}
        onNavigate={onNavigate}
      />

      <div className="chat-layout-grid">
        <ChatMessageList
          mensagens={mensagens}
          idUsuario={idUsuario}
          idPedido={idPedido}
          tituloChat={tituloChat}
          statusPedido={orcamentoAtual.status}
          isCostureira={isCostureira}
          onEnviarMensagem={handleEnviarMensagem}
          onAceitarProposta={handleAbrirModalAceitarProposta}
          onRecusarProposta={handleRecusarProposta}
          onAceitarProva={handleAceitarProva}
          onRecusarProva={handleRecusarProva}
        />

        <ChatSidebar
          orcamentoAtual={orcamentoAtual}
          isCostureira={isCostureira}
          idCostureiraPedido={idCostureiraChat}
          costureiraNome={costureiraNome}
          medidas={medidas}
          pedido={pedidoDados}
          idPedido={idPedido}
          jaAvaliado={jaAvaliado}
          provaAgendada={provaComLocalFallback}
          temProvaPendente={temProvaPendente}
          onOpenProposta={() => setMostrarProposta(true)}
          onOpenProva={() => setMostrarProva(true)}
          onCancelarProva={() => setMostrarCancelarProva(true)}
          onConcluirServico={handleConcluirServico}
          onConfirmarEntrega={() => setMostrarConfirmarEntrega(true)}
          onOpenAvaliacao={() => setMostrarAvaliacao(true)}
          onCancelarPedido={() => setMostrarCancelar(true)}
          onOpenMedidas={() => setMostrarMedidas(true)}
          onNavigate={onNavigate}
        />
      </div>

      <ModalProposta
        isOpen={mostrarProposta}
        onClose={() => setMostrarProposta(false)}
        onEnviar={handleEnviarPropostaModal}
        descricaoInicial={infoDesc.descricao}
        tipoInicial={infoDesc.tipo}
        prazoDesejado={prazoSolicitadoCliente}
        horarioLimite={horarioLimiteCliente}
      />

      <ModalProva
        isOpen={mostrarProva}
        onClose={() => setMostrarProva(false)}
        onEnviar={handleEnviarPropostaProva}
        enderecoCostureira={costureiraEndereco}
        onIrParaPerfil={
          onNavigate
            ? () => {
                setMostrarProva(false);
                onNavigate('perfil');
              }
            : null
        }
      />

      <ModalCancelarProva
        isOpen={mostrarCancelarProva}
        onClose={() => setMostrarCancelarProva(false)}
        onConfirmar={handleCancelarProva}
        provaAgendada={provaComLocalFallback}
        isCostureira={isCostureira}
        enviando={cancelandoProva}
      />

      <ModalMedidas
        isOpen={mostrarMedidas}
        onClose={() => setMostrarMedidas(false)}
        medidasAtuais={medidas}
        onSalvar={async (novasMedidas) => {
          const targetId = isCostureira ? (pedidoDados?.clienteId || pedidoDados?.id_cliente) : idUsuario;
          try {
            const res = await fetch(`/api/usuarios/${targetId}/medidas`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(novasMedidas)
            });
            if (res.ok) {
              setMedidas(novasMedidas);
              setMostrarMedidas(false);
            }
          } catch (err) { alert(err.message); }
        }}
      />

      <ModalAvaliacao
        isOpen={mostrarAvaliacao}
        onClose={() => setMostrarAvaliacao(false)}
        onEnviar={async ({ nota, comentario }) => {
          try {
            const res = await fetch('/api/avaliacoes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id_ordem_servico: idOrdemServicoAvaliacao,
                id_cliente: Number(idUsuario),
                nota,
                comentario
              })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              alert('Obrigado pela sua avaliação!');
              setJaAvaliado(true);
              setMostrarAvaliacao(false);
            } else {
              alert(data.erro || data.error || 'Não foi possível enviar a avaliação.');
            }
          } catch (err) { alert(err.message); }
        }}
      />

      <ModalCancelarPedido
        isOpen={mostrarCancelar}
        onClose={() => setMostrarCancelar(false)}
        onConfirmar={handleCancelarPedido}
        isCostureira={isCostureira}
        enviando={cancelandoPedido}
      />

      <ModalAceitarProposta
        isOpen={Boolean(propostaParaAceitar)}
        onClose={() => setPropostaParaAceitar(null)}
        onConfirmar={handleConfirmarAceiteProposta}
        dadosProposta={propostaParaAceitar?.dadosProposta}
        orcamentoAtual={orcamentoAtual}
        costureiraNome={costureiraNome}
        onVerPerfil={
          onNavigate && idCostureiraPerfil
            ? () => {
                setPropostaParaAceitar(null);
                onNavigate('portfolio', idCostureiraPerfil);
              }
            : null
        }
        enviando={aceitandoProposta}
      />

      <ModalConfirmarEntrega
        isOpen={mostrarConfirmarEntrega}
        onClose={() => setMostrarConfirmarEntrega(false)}
        onConfirmar={handleConfirmarEntrega}
        enviando={confirmandoEntrega}
      />
    </div>
  );
}

export default ChatContainer;