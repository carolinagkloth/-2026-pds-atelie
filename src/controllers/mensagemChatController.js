const MensagemChatModel = require('../models/mensagemChatModel');
const PedidoModel = require('../models/pedidoModel');
const { dispararNotificacao } = require('../services/notificacaoService');

class MensagemChatController {
  static async enviar(req, res, next) {
    try {
      const { id_pedido, conteudo, tipo_mensagem, dados_proposta, valor_proposta, prazo_proposta, valor_entrada } = req.body;
      const id_remetente = req.body.id_remetente || req.usuarioId || (req.usuario && req.usuario.id);

      if (!id_remetente) {
        return res.status(401).json({ error: 'Não foi possível identificar o usuário remetente.' });
      }

      if (!id_pedido || !conteudo) {
        return res.status(400).json({ error: 'Os campos id_pedido e conteudo são obrigatórios.' });
      }

      const novaMensagem = await MensagemChatModel.criar({
        id_pedido,
        id_remetente,
        conteudo,
        tipo_mensagem,
        dados_proposta,
        valor_proposta: valor_proposta || null,
        prazo_proposta: prazo_proposta || null,
        valor_entrada: valor_entrada || 0
      });

      const pedido = await PedidoModel.buscarPorId(id_pedido);
      const idCostureira = await PedidoModel.buscarCostureiraVinculada(id_pedido);

      const idCliente = pedido?.id_cliente;
      const idDestinatario = Number(id_remetente) === Number(idCliente) ? idCostureira : idCliente;

      if (idDestinatario) {
        const tipoNotif = tipo_mensagem === 'proposta' ? 'proposta' : 'chat';
        const tituloNotif = tipo_mensagem === 'proposta' ? 'Nova Proposta Recebida' : 'Nova Mensagem no Chat';

        await dispararNotificacao({
          idUsuario: idDestinatario,
          titulo: tituloNotif,
          mensagem: conteudo,
          tipo: tipoNotif,
          idPedido: id_pedido,
          forcarWhatsapp: false
        });
      }

      return res.status(201).json({ 
        message: 'Mensagem enviada com sucesso!', 
        mensagem: 'Mensagem enviada com sucesso!',
        id_mensagem: novaMensagem.id_mensagem,
        item: novaMensagem,
        ...novaMensagem 
      });
    } catch (error) {
      if (next) return next(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async listar(req, res, next) {
    try {
      const id_pedido = req.params.idPedido || req.params.id_pedido;
      const mensagens = await MensagemChatModel.listarPorPedido(id_pedido);
      return res.status(200).json(mensagens);
    } catch (error) {
      if (next) return next(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async listarConversasDoUsuario(req, res) {
    try {
      const { idUsuario } = req.params;
      const conversas = await MensagemChatModel.buscarConversasUsuario(idUsuario);
      return res.status(200).json(conversas);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MensagemChatController;