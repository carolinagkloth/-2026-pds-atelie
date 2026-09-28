const AvaliacaoModel = require('../models/avaliacaoModel');

class AvaliacaoController {
  static async criar(req, res, next) {
    try {
      const { ordem_servico_id, nota, comentario } = req.body;
      const cliente_id = req.usuarioId;

      if (!ordem_servico_id || !nota) {
        return res.status(400).json({ error: 'Ordem de serviço e nota são obrigatórias.' });
      }

      const id_avaliacao = await AvaliacaoModel.criar({ ordem_servico_id, cliente_id, nota, comentario });
      return res.status(201).json({ message: 'Avaliação registrada!', id_avaliacao });
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