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
  
  static async buscarPorOrdemServico(id_ordem_servico) {
    const sql = `SELECT * FROM avaliacoes WHERE id_ordem_servico = ? LIMIT 1`;
    const [rows] = await db.execute(sql, [id_ordem_servico]);
    return rows[0] || null;
  }

static async buscarOrdemServicoPorId(id_ordem_servico) {
  const sql = `
    SELECT 
      os.*, 
      p.id_cliente
    FROM ordens_servico os
    LEFT JOIN pedidos p ON os.id_pedido = p.id_pedido
    WHERE os.id_ordem_servico = ?
    LIMIT 1
  `;
  const [rows] = await db.execute(sql, [id_ordem_servico]);
  return rows[0] || null;
}

  static async obterMediaCostureira(id_costureira) {
  const sql = `
    SELECT 
      COALESCE(ROUND(AVG(a.nota), 1), 0) AS media_nota,
      COUNT(a.id_avaliacao) AS total_avaliacoes
    FROM avaliacoes a
    INNER JOIN ordens_servico os ON a.id_ordem_servico = os.id_ordem_servico
    WHERE os.id_costureira = ?
  `;
  const [rows] = await db.execute(sql, [id_costureira]);
  return rows[0];
}
}

module.exports = AvaliacaoModel;