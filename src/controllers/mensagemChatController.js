const MensagemChatModel = require('../models/mensagemChatModel');

class MensagemChatController {
  static async enviar(req, res, next) {
    try {
      const { id_pedido, conteudo, valor_proposta, prazo_proposta } = req.body;
      
      // Captura o ID do remetente do token descodificado
      const id_remetente = req.usuarioId || (req.usuario && req.usuario.id);

      if (!id_remetente) {
        return res.status(401).json({ error: 'Não foi possível identificar o utilizador remetente.' });
      }

      if (!id_pedido || !conteudo) {
        return res.status(400).json({ error: 'Os campos id_pedido e conteudo são obrigatórios.' });
      }

      const id_mensagem = await MensagemChatModel.criar({
        id_pedido,
        id_remetente,
        conteudo,
        valor_proposta: valor_proposta || null,
        prazo_proposta: prazo_proposta || null
      });

      return res.status(201).json({ message: 'Mensagem enviada com sucesso!', id_mensagem });
    } catch (error) {
      next(error);
    }
  }

  static async listar(req, res, next) {
    try {
      const id_pedido = req.params.idPedido || req.params.id_pedido;
      const mensagens = await MensagemChatModel.listarPorPedido(id_pedido);
      return res.status(200).json(mensagens);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MensagemChatController;