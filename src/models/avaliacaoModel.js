const db = require('../config/database');

class AvaliacaoModel {
  static async criar({ id_ordem_servico, id_cliente, nota, comentario }) {
    const [result] = await db.query(
      'INSERT INTO avaliacoes (id_ordem_servico, id_cliente, nota, comentario, data_avaliacao) VALUES (?, ?, ?, ?, NOW())',
      [id_ordem_servico, id_cliente, nota, comentario]
    );
    return result.insertId;
  }

  static async buscarPorCostureira(id_costureira) {
    const [linhas] = await db.execute(
      `SELECT a.*, u.nome AS nome_cliente 
       FROM avaliacoes a
       JOIN ordens_servico os ON a.id_ordem_servico = os.id_ordem_servico
       JOIN usuarios u ON a.id_cliente = u.id_usuario
       WHERE os.id_costureira = ?`,
      [id_costureira]
    );
    return linhas;
  }
}

module.exports = AvaliacaoModel;