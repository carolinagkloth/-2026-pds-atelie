const pool = require('../config/database');

const notificacaoModel = {
  async criarNotificacao(idUsuario, titulo, mensagem, tipo, idPedido = null) {
    const query = `
      INSERT INTO notificacoes (id_usuario, titulo, mensagem, tipo, id_pedido) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`;
    const result = await pool.query(query, [idUsuario, titulo, mensagem, tipo, idPedido]);
    return result.rows[0];
  },

  async buscarPorUsuario(idUsuario) {
    const query = `
      SELECT * FROM notificacoes 
      WHERE id_usuario = $1 
      ORDER BY data_criacao DESC LIMIT 30`;
    const result = await pool.query(query, [idUsuario]);
    return result.rows;
  },

  async marcarComoLida(idNotificacao) {
    const query = `UPDATE notificacoes SET lida = TRUE WHERE id_notificacao = $1 RETURNING *`;
    const result = await pool.query(query, [idNotificacao]);
    return result.rows[0];
  },

  async marcarTodasComoLidas(idUsuario) {
    const query = `UPDATE notificacoes SET lida = TRUE WHERE id_usuario = $1 RETURNING *`;
    const result = await pool.query(query, [idUsuario]);
    return result.rows[0];
  },

  async buscarPreferenciasEContacto(idUsuario) {
    const query = `
      SELECT u.email, u.nome, u.telefone, c.* 
      FROM usuarios u
      LEFT JOIN configuracoes_notificacoes c ON u.id_usuario = c.id_usuario
      WHERE u.id_usuario = $1`;
    const result = await pool.query(query, [idUsuario]);
    return result.rows[0];
  }
};

module.exports = notificacaoModel;