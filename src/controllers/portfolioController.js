const PortfolioModel = require('../models/portfolioModel');
const UsuarioModel = require('../models/usuarioModel');

class PortfolioController {
  static async criar(req, res) {
    try {
      const { id_costureira, titulo_trabalho, url_imagem, data_publicacao } = req.body;
      if (!id_costureira || !titulo_trabalho || !url_imagem) {
        return res.status(400).json({ error: 'Os campos id_costureira, titulo_trabalho e url_imagem são obrigatórios.' });
      }

      const costureira = await UsuarioModel.buscarPorId(id_costureira);
      if (!costureira || costureira.tipo_usuario !== 'Costureira') {
        return res.status(400).json({ error: 'O id_costureira informado não pertence a uma costureira válida.' });
      }

      const idInserido = await PortfolioModel.criar({
        id_costureira,
        titulo_trabalho,
        url_imagem,
        data_publicacao
      });

      return res.status(201).json({
        message: 'Item adicionado ao portfólio com sucesso!',
        id_midia: idInserido
      });
    } catch (error) {
      console.error('Erro ao criar item no portfólio:', error);
      return res.status(500).json({ error: 'Erro interno ao salvar item no portfólio.' });
    }
  }

  static async listarTodos(req, res) {
    try {
      const itens = await PortfolioModel.listarTodos();
      return res.status(200).json(itens);
    } catch (error) {
      console.error('Erro ao listar portfólio:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar itens do portfólio.' });
    }
  }

  static async listarPorCostureira(req, res) {
    try {
      const { id_costureira } = req.params;
      const itens = await PortfolioModel.buscarPorCostureira(id_costureira);
      return res.status(200).json(itens);
    } catch (error) {
      console.error('Erro ao buscar portfólio da costureira:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar portfólio.' });
    }
  }

  static async deletar(req, res) {
    try {
      const { id } = req.params;

      const itemExistente = await PortfolioModel.buscarPorId(id);
      if (!itemExistente) {
        return res.status(404).json({ error: 'Item de portfólio não encontrado.' });
      }

      await PortfolioModel.deletar(id);
      return res.status(200).json({ message: 'Item do portfólio removido com sucesso!' });
    } catch (error) {
      console.error('Erro ao deletar item do portfólio:', error);
      return res.status(500).json({ error: 'Erro interno ao deletar item.' });
    }
  }
}

module.exports = PortfolioController;