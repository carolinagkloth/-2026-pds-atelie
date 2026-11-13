const pool = require('../config/database');
const notificacaoModel = require('../models/notificacaoModel');

class NotificacaoController {
  // Buscar notificações do usuário
  static async listarPorUsuario(req, res) {
    const idUsuario = req.params.usuario_id || req.params.idUsuario;
    if (!idUsuario) {
      return res.status(400).json({ erro: 'ID do usuário não informado.' });
    }

    try {
      const query = `
        SELECT * FROM notificacoes 
        WHERE id_usuario = $1 
        ORDER BY data_criacao DESC
        LIMIT 30;
      `;
      const result = await pool.query(query, [idUsuario]);
      return res.json(result.rows);
    } catch (err) {
      console.error('Erro ao listar notificações:', err);
      return res.status(500).json({ erro: 'Erro ao buscar notificações.' });
    }
  }

  // MARCAR UMA NOTIFICAÇÃO COMO LIDA
  static async marcarComoLida(req, res) {
    const idNotificacao = req.params.idNotificacao || req.params.id;
    try {
      await pool.query(
        `UPDATE notificacoes SET lida = TRUE WHERE id_notificacao = $1;`,
        [idNotificacao]
      );
      return res.json({ mensagem: 'Notificação marcada como lida.' });
    } catch (err) {
      console.error('Erro ao atualizar notificação:', err);
      return res.status(500).json({ erro: 'Erro ao atualizar notificação.' });
    }
  }

  // MARCAR TODAS COMO LIDAS
  static async marcarTodasComoLidas(req, res) {
    const idUsuario = req.params.idUsuario || req.params.usuario_id;
    try {
      await pool.query(
        `UPDATE notificacoes SET lida = TRUE WHERE id_usuario = $1 AND COALESCE(lida, FALSE) = FALSE;`,
        [idUsuario]
      );
      return res.json({ mensagem: 'Todas as notificações foram marcadas como lidas.' });
    } catch (err) {
      console.error('Erro ao atualizar notificações:', err);
      return res.status(500).json({ erro: 'Erro ao atualizar notificações.' });
    }
  }
}

module.exports = NotificacaoController;