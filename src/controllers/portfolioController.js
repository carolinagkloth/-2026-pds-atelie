const PortfolioModel = require('../models/portfolioModel');
const UsuarioModel = require('../models/usuarioModel');

class PortfolioController {
  static async criar(req, res) {
    try {
      const id_costureira = req.body.id_costureira || req.body.idCostureira;
      const { titulo_trabalho, url_imagem, data_publicacao } = req.body;

      if (!id_costureira || !url_imagem) {
        return res.status(400).json({ 
          error: 'Os campos id_costureira e url_imagem são obrigatórios.',
          erro: 'Os campos id_costureira e url_imagem são obrigatórios.'
        });
      }

      const costureira = await UsuarioModel.buscarPorId(id_costureira);
      if (!costureira || (costureira.tipo_usuario !== 'Costureira' && costureira.tipo_usuario !== 'costureira')) {
        return res.status(400).json({ 
          error: 'O id_costureira informado não pertence a uma costureira válida.',
          erro: 'O id_costureira informado não pertence a uma costureira válida.'
        });
      }

      const item = await PortfolioModel.criar({
        id_costureira,
        titulo_trabalho,
        url_imagem,
        data_publicacao
      });

      return res.status(201).json({
        message: 'Item adicionado ao portfólio com sucesso!',
        mensagem: 'Trabalho adicionado com sucesso!',
        id_midia: item.id_midia,
        id: item.id,
        item
      });
    } catch (error) {
      console.error('Erro ao criar item no portfólio:', error);
      return res.status(500).json({ 
        error: 'Erro interno ao salvar item no portfólio.',
        erro: error.message 
      });
    }
  }

  static async listarTodos(req, res) {
    try {
      const itens = await PortfolioModel.listarTodos();
      return res.status(200).json(itens);
    } catch (error) {
      console.error('Erro ao listar portfólio:', error);
      return res.status(500).json({ 
        error: 'Erro interno ao buscar itens do portfólio.',
        erro: 'Erro ao carregar fotos do portfólio.'
      });
    }
  }

  static async listarPorCostureira(req, res) {
    try {
      const id_costureira = req.params.id_costureira || req.params.idCostureira || req.params.costureiraId;
      const itens = await PortfolioModel.buscarPorCostureira(id_costureira);
      return res.status(200).json(itens);
    } catch (error) {
      console.error('Erro ao buscar portfólio da costureira:', error);
      return res.status(500).json({ 
        error: 'Erro interno ao buscar portfólio.',
        erro: 'Erro ao carregar fotos do portfólio.'
      });
    }
  }

  static async deletar(req, res) {
    try {
      const id = req.params.id || req.params.idMidia;

      const itemExistente = await PortfolioModel.buscarPorId(id);
      if (!itemExistente) {
        return res.status(404).json({ 
          error: 'Item de portfólio não encontrado.',
          erro: 'Imagem não encontrada.' 
        });
      }

      await PortfolioModel.deletar(id);
      return res.status(200).json({ 
        message: 'Item do portfólio removido com sucesso!',
        mensagem: 'Foto removida do portfólio!'
      });
    } catch (error) {
      console.error('Erro ao deletar item do portfólio:', error);
      return res.status(500).json({ 
        error: 'Erro interno ao deletar item.',
        erro: 'Erro ao remover imagem.' 
      });
    }
  }
}

module.exports = PortfolioController;