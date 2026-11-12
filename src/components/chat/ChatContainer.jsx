import React, { useState, useEffect, useCallback } from 'react';
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

  const idPedido = pedido?.id || pedido?.id_pedido;

  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [costureiraNome, setCostureiraNome] = useState('');
  const [idCostureiraChat, setIdCostureiraChat] = useState(
    isCostureira ? idUsuario : (idCostureiraProp || pedido?.costureiraId || pedido?.id_costureira || null)
  );

  // Modais e controle de avaliação
  const [mostrarProposta, setMostrarProposta] = useState(false);
  const [mostrarProva, setMostrarProva] = useState(false);
  const [mostrarMedidas, setMostrarMedidas] = useState(false);
  const [mostrarAvaliacao, setMostrarAvaliacao] = useState(false);
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

  const infoDesc = parsePedidoDescricao(pedido?.descricao);
  const tituloChat = `${infoDesc.tipo}\n${infoDesc.descricao}`;

  // RESOLUÇÃO ROBUSTA DO NOME DA COSTUREIRA
  const resolverNomeCostureira = useCallback(async (idCost, msgsList = []) => {
    if (isCostureira) {
      setCostureiraNome(user?.nome || 'Costureira');
      return;
    }

    if (pedido?.costureiraNome || pedido?.costureira_nome) {
      setCostureiraNome(pedido.costureiraNome || pedido.costureira_nome);
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
  }, [isCostureira, user?.nome, pedido, idUsuario]);

  // CARREGAMENTO DAS MENSAGENS E DADOS DO CHAT
  const carregarMensagens = useCallback(async () => {
    if (!idPedido) return;
    setCarregando(true);
    try {
      const url = idCostureiraChat 
        ? `/api/mensagens-chat/${idPedido}?id_costureira=${idCostureiraChat}`
        : `/api/mensagens-chat/${idPedido}`;

      const [resMsgs, resPed, resAval] = await Promise.all([
        fetch(url),
        fetch(`/api/pedidos/${idPedido}`).catch(() => null),
        !isCostureira ? fetch(`/api/avaliacoes/pedido/${idPedido}`).catch(() => null) : Promise.resolve(null)
      ]);

      const data = await resMsgs.json();
      if (Array.isArray(data)) {
        setMensagens(data);

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

        resolverNomeCostureira(costureiraIdIdentificado, data);
      }

      if (resPed && resPed.ok) {
        const pedData = await resPed.json();
        const statusReal = pedData.status_kanban || pedData.status_pedido || pedData.status;
        if (statusReal) setOrcamentoAtual((prev) => ({ ...prev, status: statusReal }));
      }

      if (resAval && resAval.ok) {
        const avalData = await resAval.json();
        if (avalData.id_ordem_servico) {
          setIdOrdemServicoAvaliacao(avalData.id_ordem_servico);
        }
        setJaAvaliado(Boolean(avalData.avaliado));
      }
    } catch (err) {
      console.error('Erro ao carregar chat:', err);
    } finally {
      setCarregando(false);
    }
  }, [idPedido, idCostureiraChat, isCostureira, resolverNomeCostureira]);

  useEffect(() => {
    carregarMensagens();
    
    // Carrega Ficha de Medidas do Cliente
    const targetId = isCostureira ? (pedido?.clienteId || pedido?.id_cliente) : idUsuario;
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
  }, [carregarMensagens, isCostureira, pedido, idUsuario]);

  const handleEnviarMensagem = async (texto) => {
    try {
      const res = await fetch('/api/mensagens-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_remetente: Number(idUsuario),
          id_costureira: Number(idCostureiraChat),
          conteudo: texto,
          tipo_mensagem: 'texto'
        })
      });
      if (res.ok) carregarMensagens();
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
        carregarMensagens();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAceitarProposta = async (dadosProposta, idRemetenteProposta) => {
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

      if (res.ok) {
        alert('Orçamento aprovado!');
        setOrcamentoAtual((prev) => ({ ...prev, status: 'Em Produção' }));
        carregarMensagens();
      }
    } catch (err) {
      alert(err.message);
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
      if (res.ok) carregarMensagens();
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
      if (res.ok) {
        alert('Peça concluída! Cliente notificado.');
        setOrcamentoAtual((prev) => ({ ...prev, status: 'Concluído' }));
        carregarMensagens();
      }
    } catch (err) { alert(err.message); }
  };

  const handleConfirmarEntrega = async () => {
    if (!window.confirm('Confirma que recebeu a peça e que está tudo certo?')) return;
    try {
      const res = await fetch('/api/ordens-servico/confirmar-entrega', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pedido: Number(idPedido), id_cliente: Number(idUsuario) })
      });
      const data = await res.json();
      if (res.ok) {
        setIdOrdemServicoAvaliacao(data.id_ordem_servico);
        setOrcamentoAtual((prev) => ({ ...prev, status: 'Entregue' }));
        carregarMensagens();
        setMostrarAvaliacao(true);
      }
    } catch (err) { alert(err.message); }
  };

  const handleCancelarPedido = async () => {
    if (!window.confirm('Deseja cancelar/desistir deste pedido?')) return;
    try {
      const res = await fetch('/api/pedidos/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pedido: Number(idPedido), id_usuario: Number(idUsuario) })
      });
      if (res.ok) {
        setOrcamentoAtual((prev) => ({ ...prev, status: 'Cancelado' }));
        carregarMensagens();
      }
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <ChatHeader
        nomeUsuario={user?.nome}
        isCostureira={isCostureira}
        carregando={carregando}
        onRefresh={carregarMensagens}
        onNavigate={onNavigate}
      />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        <ChatMessageList
          mensagens={mensagens}
          idUsuario={idUsuario}
          idPedido={idPedido}
          tituloChat={tituloChat}
          statusPedido={orcamentoAtual.status}
          isCostureira={isCostureira}
          onEnviarMensagem={handleEnviarMensagem}
          onAceitarProposta={handleAceitarProposta}
          onRecusarProposta={handleRecusarProposta}
        />
        
        <ChatSidebar
          orcamentoAtual={orcamentoAtual}
          isCostureira={isCostureira}
          idCostureiraPedido={idCostureiraChat}
          costureiraNome={costureiraNome}
          medidas={medidas}
          pedido={pedido}
          idPedido={idPedido}
          jaAvaliado={jaAvaliado}
          onOpenProposta={() => setMostrarProposta(true)}
          onOpenProva={() => setMostrarProva(true)}
          onConcluirServico={handleConcluirServico}
          onConfirmarEntrega={handleConfirmarEntrega}
          onOpenAvaliacao={() => setMostrarAvaliacao(true)}
          onCancelarPedido={handleCancelarPedido}
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
      />

      <ModalProva
        isOpen={mostrarProva}
        onClose={() => setMostrarProva(false)}
        onConfirmar={async (dadosProva) => {
          try {
            const res = await fetch('/api/ordens-servico/agendar-prova', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...dadosProva, id_pedido: Number(idPedido), id_costureira: Number(idCostureiraChat) })
            });
            if (res.ok) {
              setMostrarProva(false);
              setOrcamentoAtual((prev) => ({ ...prev, status: 'Aguardando Prova' }));
              carregarMensagens();
            }
          } catch (err) { alert(err.message); }
        }}
      />

      <ModalMedidas
        isOpen={mostrarMedidas}
        onClose={() => setMostrarMedidas(false)}
        medidasAtuais={medidas}
        onSalvar={async (novasMedidas) => {
          const targetId = isCostureira ? (pedido?.clienteId || pedido?.id_cliente) : idUsuario;
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
    </div>
  );
}

export default ChatContainer;