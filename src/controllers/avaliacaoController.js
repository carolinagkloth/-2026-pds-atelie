const AvaliacaoModel = require('../models/avaliacaoModel');

class AvaliacaoController {
  static async criar(req, res, next) {
  try {
    const { id_ordem_servico, nota, comentario } = req.body;
    
    // Captura o ID do cliente tratando possíveis variações no token
    const id_cliente = req.usuarioId || req.usuario?.id || req.usuario?.id_usuario;

    if (!id_ordem_servico || nota === undefined) {
      return res.status(400).json({ error: 'Ordem de serviço e nota são obrigatórias.' });
    }

    if (!id_cliente) {
      return res.status(400).json({ error: 'Identificação do cliente não encontrada no token.' });
    }

    // Envia id_cliente para a Model
    const id_avaliacao = await AvaliacaoModel.criar({ 
      id_ordem_servico, 
      id_cliente, 
      cliente_id: id_cliente, 
      nota, 
      comentario 
    });

    return res.status(201).json({ message: 'Avaliação registrada com sucesso!', id_avaliacao });
  } catch (error) {
    next(error);
  }
}

  static async listarPorCostureira(req, res, next) {
    try {
      const { costureiraId } = req.params;
      const avaliacoes = await AvaliacaoModel.buscarPorCostureira(costureiraId);
      return res.status(200).json(avaliacoes);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AvaliacaoController;