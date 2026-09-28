const db = require('../config/database');

class AvaliacaoModel {
  static async criar({ id_ordem_servico, id_pedido, nota, comentario }) {
    const [result] = await db.query(
      'INSERT INTO avaliacao (ordem_servico_id, cliente_id, nota, comentario, data_avaliacao) VALUES (?, ?, ?, ?, NOW())',
      [id_ordem_servico, id_pedido, nota, comentario]
    );
    return result.insertId;
  }

  static async buscarPorCostureira(id_costureira) {
    const [linhas] = await db.execute(
      `SELECT a.*, u.nome AS nome_cliente 
       FROM avaliacao a
       JOIN ordem_servico os ON a.id_ordem_servico = os.id_ordem_servico
       JOIN usuarios u ON a.id_cliente = u.id_usuario
       WHERE os.id_costureira = ?`,
      [id_costureira]
    );
    return linhas;
  }
}

module.exports = AvaliacaoModel;