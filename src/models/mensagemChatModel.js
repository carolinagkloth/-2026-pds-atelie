const db = require('../config/database');

class MensagemChatModel {
  static async criar({ id_pedido, id_remetente, conteudo, valor_proposta, prazo_proposta }) {
    const query = `
      INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, valor_proposta, prazo_proposta, data_hora_envio)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await db.query(query, [
      id_pedido, 
      id_remetente, 
      conteudo, 
      valor_proposta || null, 
      prazo_proposta || null
    ]);
    return result.insertId;
  }

  static async listarPorPedido(id_pedido) {
    const query = `
      SELECT m.*, u.nome AS nome_remetente 
      FROM mensagens_chat m 
      JOIN usuarios u ON m.id_remetente = u.id_usuario 
      WHERE m.id_pedido = ? 
      ORDER BY m.data_hora_envio ASC
    `;
    const [linhas] = await db.execute(query, [id_pedido]);
    return linhas;
  }
}

module.exports = MensagemChatModel;