const AvaliacaoModel = require('../models/avaliacaoModel');

class AvaliacaoController {
  // src/controllers/avaliacaoController.js

// src/controllers/avaliacaoController.js

static async criar(req, res, next) {
  try {
    const { id_ordem_servico, nota, comentario } = req.body;

    // 1. Captura o ID do cliente logado no JWT (testando todas as variações possíveis)
    const id_cliente = req.usuarioId || req.usuario?.id || req.usuario?.id_usuario || req.usuario?.cliente_id || req.usuario?.id_cliente;

    if (!id_ordem_servico || nota === undefined) {
      return res.status(400).json({ error: 'Ordem de serviço e nota são obrigatórias.' });
    }

    // 2. Busca a Ordem de Serviço
    const ordem = await AvaliacaoModel.buscarOrdemServicoPorId(id_ordem_servico);
    if (!ordem) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    }

    // 3. Captura o ID do cliente proprietário da OS no banco de dados
    const clienteDonoDaOS = ordem.cliente_id || ordem.id_cliente || ordem.usuario_id || ordem.id_usuario;

    // 4. Validação de propriedade da OS
    if (!clienteDonoDaOS || Number(clienteDonoDaOS) !== Number(id_cliente)) {
      return res.status(403).json({ error: 'Acesso negado: esta ordem de serviço pertence a outro cliente.' });
    }

    // 5. Garantir status Concluída ou Entregue
    const statusOS = ordem.status || ordem.status_kanban;
    const statusValidos = ['concluida', 'concluída', 'entregue', 'concluído', 'concluido'];
    if (!statusOS || !statusValidos.includes(String(statusOS).toLowerCase())) {
      return res.status(400).json({ 
        error: `Apenas ordens de serviço concluídas ou entregues podem ser avaliadas. Status atual: ${statusOS || 'Indefinido'}` 
      });
    }

    // 6. Impedir avaliação duplicada
    const avaliacaoExistente = await AvaliacaoModel.buscarPorOrdemServico(id_ordem_servico);
    if (avaliacaoExistente) {
      return res.status(400).json({ error: 'Esta ordem de serviço já foi avaliada anteriormente.' });
    }

    // Gravação da avaliação
    const id_avaliacao = await AvaliacaoModel.criar({ 
      id_ordem_servico, 
      id_cliente, 
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


static async obterMediaCostureira(req, res, next) {
  try {
    const { costureiraId } = req.params;

    if (!costureiraId) {
      return res.status(400).json({ error: 'ID da costureira é obrigatório.' });
    }

    const estatisticas = await AvaliacaoModel.obterMediaCostureira(costureiraId);

    return res.status(200).json({
      id_costureira: Number(costureiraId),
      media_nota: Number(estatisticas.media_nota),
      total_avaliacoes: Number(estatisticas.total_avaliacoes)
    });
  } catch (error) {
    next(error);
  }
}
}

module.exports = AvaliacaoController;