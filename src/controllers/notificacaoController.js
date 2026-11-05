const notificacaoModel = require('../models/notificacaoModel');

const notificacaoController = {
  async listarPorUsuario(req, res) {
    try {
      const idUsuario = req.params.idUsuario || req.params.usuario_id;
      const notificacoes = await notificacaoModel.buscarPorUsuario(idUsuario);
      return res.json(notificacoes);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao buscar notificações.' });
    }
  },

  async marcarComoLida(req, res) {
    try {
      const idNotificacao = req.params.idNotificacao || req.params.id;
      await notificacaoModel.marcarComoLida(idNotificacao);
      return res.json({ mensagem: 'Notificação lida com sucesso.' });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao atualizar notificação.' });
    }
  },

  async marcarTodasComoLidas(req, res) {
    try {
      const idUsuario = req.params.idUsuario || req.params.usuario_id;
      await notificacaoModel.marcarTodasComoLidas(idUsuario);
      return res.json({ mensagem: 'Todas as notificações foram marcadas como lidas.' });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao atualizar notificações.' });
    }
  }
};

module.exports = notificacaoController;