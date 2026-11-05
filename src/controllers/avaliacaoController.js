const AvaliacaoModel = require('../models/avaliacaoModel');
const { dispararNotificacao } = require('../services/notificacaoService');

class AvaliacaoController {
  static async criar(req, res, next) {
    try {
      const { id_ordem_servico, nota, comentario } = req.body;

      // 1. Captura o ID do cliente logado no JWT ou no corpo da requisição
      const id_cliente = req.body.id_cliente || req.usuarioId || req.usuario?.id || req.usuario?.id_usuario || req.usuario?.cliente_id || req.usuario?.id_cliente;

      if (!id_ordem_servico || nota === undefined) {
        return res.status(400).json({ error: 'Ordem de serviço e nota são obrigatórias.', erro: 'Ordem de serviço e nota são obrigatórias.' });
      }

      // 2. Busca a Ordem de Serviço
      const ordem = await AvaliacaoModel.buscarOrdemServicoPorId(id_ordem_servico);
      if (!ordem) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada.', erro: 'Ordem de serviço não encontrada.' });
      }

      // 3. Captura o ID do cliente proprietário da OS
      const clienteDonoDaOS = ordem.id_cliente || ordem.cliente_id || ordem.usuario_id || ordem.id_usuario;

      // 4. Validação de propriedade da OS
      if (id_cliente && clienteDonoDaOS && Number(clienteDonoDaOS) !== Number(id_cliente)) {
        return res.status(403).json({ error: 'Acesso negado: esta ordem de serviço pertence a outro cliente.', erro: 'Acesso negado: esta ordem de serviço pertence a outro cliente.' });
      }

      // 5. Garantir status Concluída ou Entregue
      const statusOS = ordem.status_kanban || ordem.status;
      const statusValidos = ['concluida', 'concluída', 'entregue', 'concluído', 'concluido'];
      if (!statusOS || !statusValidos.includes(String(statusOS).toLowerCase())) {
        return res.status(400).json({ 
          error: `Apenas ordens de serviço concluídas ou entregues podem ser avaliadas. Status atual: ${statusOS || 'Indefinido'}`,
          erro: `Apenas ordens de serviço concluídas ou entregues podem ser avaliadas. Status atual: ${statusOS || 'Indefinido'}` 
        });
      }

      // 6. Impedir avaliação duplicada
      const avaliacaoExistente = await AvaliacaoModel.buscarPorOrdemServico(id_ordem_servico);
      if (avaliacaoExistente) {
        return res.status(400).json({ error: 'Esta ordem de serviço já foi avaliada anteriormente.', erro: 'Esta ordem de serviço já foi avaliada anteriormente.' });
      }

      // Gravação da avaliação
      const idClienteEfetivo = id_cliente || clienteDonoDaOS;
      const avaliacao = await AvaliacaoModel.criar({ 
        id_ordem_servico, 
        id_cliente: idClienteEfetivo, 
        nota, 
        comentario 
      });

      // Notifica a costureira sobre a nova avaliação recebida
      if (ordem.id_costureira) {
        await dispararNotificacao({
          idUsuario: ordem.id_costureira,
          titulo: 'Nova Avaliação Recebida! ⭐',
          mensagem: `O cliente deixou uma nota ${nota}/5 e um comentário sobre o seu serviço.`,
          tipo: 'avaliacao',
          forcarWhatsapp: false
        });
      }

      return res.status(201).json({ 
        message: 'Avaliação registrada com sucesso!', 
        mensagem: 'Avaliação registrada com sucesso!', 
        id_avaliacao: avaliacao.id_avaliacao,
        avaliacao 
      });
    } catch (error) {
      if (next) return next(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async listarPorCostureira(req, res, next) {
    try {
      const idCostureira = req.params.costureiraId || req.params.idCostureira;
      const avaliacoes = await AvaliacaoModel.buscarPorCostureira(idCostureira);
      const estatisticas = await AvaliacaoModel.obterMediaCostureira(idCostureira);

      return res.status(200).json({
        media: parseFloat(estatisticas?.media_nota) || 0,
        media_nota: parseFloat(estatisticas?.media_nota) || 0,
        totalAvaliacoes: parseInt(estatisticas?.total_avaliacoes) || 0,
        total_avaliacoes: parseInt(estatisticas?.total_avaliacoes) || 0,
        depoimentos: avaliacoes,
        avaliacoes
      });
    } catch (error) {
      if (next) return next(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async obterMediaCostureira(req, res, next) {
    try {
      const idCostureira = req.params.costureiraId || req.params.idCostureira;

      if (!idCostureira) {
        return res.status(400).json({ error: 'ID da costureira é obrigatório.', erro: 'ID da costureira é obrigatório.' });
      }

      const estatisticas = await AvaliacaoModel.obterMediaCostureira(idCostureira);

      return res.status(200).json({
        id_costureira: Number(idCostureira),
        media: Number(estatisticas.media_nota),
        media_nota: Number(estatisticas.media_nota),
        totalAvaliacoes: Number(estatisticas.total_avaliacoes),
        total_avaliacoes: Number(estatisticas.total_avaliacoes)
      });
    } catch (error) {
      if (next) return next(error);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AvaliacaoController;