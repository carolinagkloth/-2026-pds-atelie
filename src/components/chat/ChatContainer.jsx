import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatSidebar from './ChatSidebar';
import ModalCancelarPedido from './modals/ModalCancelarPedido';
import ModalAceitarProposta from './modals/ModalAceitarProposta';
import ModalConfirmarEntrega from './modals/ModalConfirmarEntrega';
import ModalCancelarProva from './modals/ModalCancelarProva';
import ModalProposta from './modals/ModalProposta';
import ModalProva from './modals/ModalProva';
import ModalMedidas from './modals/ModalMedidas';
import ModalAvaliacao from './modals/ModalAvaliacao';
import { useChatPedido } from './hooks/useChatPedido';

function ChatContainer({ pedido, usuario, idCostureiraProp, onNavigate }) {
  const chat = useChatPedido({ pedido, usuario, idCostureiraProp });

  const [modais, setModais] = useState({
    proposta: false,
    prova: false,
    cancelarProva: false,
    medidas: false,
    avaliacao: false,
    cancelarPedido: false,
    confirmarEntrega: false,
    propostaAceitar: null
  });
  const [carregandoModal, setCarregandoModal] = useState(false);

  const fecharModal = (chave, valor = false) =>
    setModais((prev) => ({ ...prev, [chave]: valor }));

  const executarComLoading = async (fn, onSucesso) => {
    setCarregandoModal(true);
    try {
      await fn();
      if (onSucesso) onSucesso();
    } catch (err) {
      alert(err.message);
    } finally {
      setCarregandoModal(false);
    }
  };

  const handleAbrirProposta = () => {
    if (chat.temPropostaAtiva) {
      alert('Já existe um orçamento pendente ou aceito neste pedido. Só é possível enviar um novo orçamento se o anterior for recusado.');
      return;
    }
    fecharModal('proposta', true);
  };

  const prazoSolicitadoCliente =
    chat.pedidoDados?.prazo_desejado || chat.pedidoDados?.prazoDesejado || '';
  const horarioLimiteCliente =
    chat.pedidoDados?.horario_limite || chat.pedidoDados?.horarioLimite || '';
  const idCostureiraPerfil =
    modais.propostaAceitar?.dadosProposta?.idCostureira ||
    modais.propostaAceitar?.idRemetenteProposta ||
    chat.idCostureiraChat;

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '0 12px', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <ChatHeader
        nomeUsuario={chat.user?.nome}
        fotoPerfil={chat.user?.foto_perfil}
        isCostureira={chat.isCostureira}
        onNavigate={onNavigate}
      />

      <div className="chat-layout-grid">
        <ChatMessageList
          mensagens={chat.mensagens}
          idUsuario={chat.idUsuario}
          idPedido={chat.idPedido}
          tituloChat={chat.tituloChat}
          statusPedido={chat.orcamentoAtual.status}
          isCostureira={chat.isCostureira}
          onEnviarMensagem={chat.acoes.enviarMensagem}
          onAceitarProposta={(dadosProposta, idRemetenteProposta) =>
            fecharModal('propostaAceitar', {
              dadosProposta,
              idRemetenteProposta: idRemetenteProposta || chat.idCostureiraChat
            })
          }
          onRecusarProposta={chat.acoes.recusarProposta}
          onAceitarProva={chat.acoes.aceitarProva}
          onRecusarProva={chat.acoes.recusarProva}
        />

        <ChatSidebar
          orcamentoAtual={chat.orcamentoAtual}
          isCostureira={chat.isCostureira}
          idCostureiraPedido={chat.idCostureiraChat}
          costureiraNome={chat.costureiraNome}
          clienteNome={chat.clienteNome}
          medidas={chat.medidas}
          pedido={chat.pedidoDados}
          idPedido={chat.idPedido}
          jaAvaliado={chat.jaAvaliado}
          provaAgendada={chat.provaComLocalFallback}
          temProvaPendente={chat.temProvaPendente}
          temPropostaAtiva={chat.temPropostaAtiva}
          onOpenProposta={handleAbrirProposta}
          onOpenProva={() => fecharModal('prova', true)}
          onCancelarProva={() => fecharModal('cancelarProva', true)}
          onConcluirServico={chat.acoes.concluirServico}
          onConfirmarEntrega={() => fecharModal('confirmarEntrega', true)}
          onOpenAvaliacao={() => fecharModal('avaliacao', true)}
          onCancelarPedido={() => fecharModal('cancelarPedido', true)}
          onOpenMedidas={() => fecharModal('medidas', true)}
          statusPagamento={chat.statusPagamento}
          onAlterarPagamento={chat.acoes.alterarPagamento}
          onNavigate={onNavigate}
        />
      </div>

      <ModalProposta
        isOpen={modais.proposta && !chat.temPropostaAtiva}
        onClose={() => fecharModal('proposta', false)}
        onEnviar={(dados) =>
          executarComLoading(
            () => chat.acoes.enviarProposta(dados),
            () => fecharModal('proposta', false)
          )
        }
        descricaoInicial={chat.infoDesc.descricao}
        tipoInicial={chat.infoDesc.tipo}
        prazoDesejado={prazoSolicitadoCliente}
        horarioLimite={horarioLimiteCliente}
      />

      <ModalProva
        isOpen={modais.prova}
        onClose={() => fecharModal('prova', false)}
        onEnviar={(dados) =>
          executarComLoading(
            () => chat.acoes.enviarPropostaProva(dados),
            () => fecharModal('prova', false)
          )
        }
        enderecoCostureira={chat.costureiraEndereco}
        onIrParaPerfil={
          onNavigate
            ? () => {
                fecharModal('prova', false);
                onNavigate('perfil');
              }
            : null
        }
      />

      <ModalCancelarProva
        isOpen={modais.cancelarProva}
        onClose={() => fecharModal('cancelarProva', false)}
        onConfirmar={(obs) =>
          executarComLoading(
            () => chat.acoes.cancelarProva(obs),
            () => fecharModal('cancelarProva', false)
          )
        }
        carregando={carregandoModal}
      />

      <ModalAceitarProposta
        isOpen={Boolean(modais.propostaAceitar)}
        proposta={modais.propostaAceitar?.dadosProposta}
        idCostureira={idCostureiraPerfil}
        onClose={() => fecharModal('propostaAceitar', null)}
        onConfirmar={() =>
          executarComLoading(
            () => chat.acoes.aceitarProposta(modais.propostaAceitar.dadosProposta, modais.propostaAceitar.idRemetenteProposta),
            () => fecharModal('propostaAceitar', null)
          )
        }
        carregando={carregandoModal}
      />

      <ModalConfirmarEntrega
        isOpen={modais.confirmarEntrega}
        onClose={() => fecharModal('confirmarEntrega', false)}
        onConfirmar={() =>
          executarComLoading(
            () => chat.acoes.confirmarEntrega(),
            () => setModais((prev) => ({ ...prev, confirmarEntrega: false, avaliacao: true }))
          )
        }
        carregando={carregandoModal}
      />

      <ModalCancelarPedido
        isOpen={modais.cancelarPedido}
        onClose={() => fecharModal('cancelarPedido', false)}
        onConfirmar={(obs) =>
          executarComLoading(
            () => chat.acoes.cancelarPedido(obs),
            () => fecharModal('cancelarPedido', false)
          )
        }
        carregando={carregandoModal}
      />

      <ModalMedidas
        isOpen={modais.medidas}
        onClose={() => fecharModal('medidas', false)}
        medidas={chat.medidas}
        clienteNome={chat.clienteNome}
      />

      <ModalAvaliacao
        isOpen={modais.avaliacao}
        onClose={() => fecharModal('avaliacao', false)}
        idOrdemServico={chat.idOrdemServicoAvaliacao}
        idPedido={chat.idPedido}
        idCliente={chat.idUsuario}
        idCostureira={chat.idCostureiraChat}
        costureiraNome={chat.costureiraNome}
        onAvaliado={() => {
          chat.setJaAvaliado(true);
          fecharModal('avaliacao', false);
        }}
      />
    </div>
  );
}

export default ChatContainer;