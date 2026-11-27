const pool = require('../config/database');

class AvaliacaoModel {
  static async criar({ id_ordem_servico, id_cliente, nota, comentario }) {
    const query = `
      INSERT INTO avaliacoes (id_ordem_servico, id_cliente, nota, comentario, data_avaliacao) 
      VALUES ($1, $2, $3, $4, NOW()) 
      RETURNING *;
    `;
    const result = await pool.query(query, [
      id_ordem_servico, 
      id_cliente, 
      nota, 
      comentario || null
    ]);
    return result.rows[0];
  }

  static async buscarPorCostureira(id_costureira) {
    const query = `
      SELECT a.id_avaliacao AS id, a.id_avaliacao, a.nota, a.comentario, a.data_avaliacao AS data, a.data_avaliacao,
             u.nome AS "clienteNome", u.nome AS nome_cliente, u.foto_perfil AS "clienteFoto"
      FROM avaliacoes a
      JOIN ordens_servico os ON a.id_ordem_servico = os.id_ordem_servico
      JOIN usuarios u ON a.id_cliente = u.id_usuario
      WHERE os.id_costureira = $1
      ORDER BY a.data_avaliacao DESC;
    `;
    const result = await pool.query(query, [id_costureira]);
    return result.rows;
  }

  static async buscarPorOrdemServico(id_ordem_servico) {
    const query = `SELECT * FROM avaliacoes WHERE id_ordem_servico = $1 LIMIT 1;`;
    const result = await pool.query(query, [id_ordem_servico]);
    return result.rows[0] || null;
  }

  static async buscarOrdemServicoPorId(id_ordem_servico) {
    const query = `
      SELECT 
        os.*, 
        p.id_cliente
      FROM ordens_servico os
      LEFT JOIN pedidos p ON os.id_pedido = p.id_pedido
      WHERE os.id_ordem_servico = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [id_ordem_servico]);
    return result.rows[0] || null;
  }

  static async obterMediaCostureira(id_costureira) {
    const query = `
      SELECT 
        COALESCE(ROUND(AVG(a.nota)::numeric, 1), 0) AS media_nota,
        COUNT(a.id_avaliacao) AS total_avaliacoes
      FROM avaliacoes a
      INNER JOIN ordens_servico os ON a.id_ordem_servico = os.id_ordem_servico
      WHERE os.id_costureira = $1;
    `;
    const result = await pool.query(query, [id_costureira]);
    return result.rows[0];
  }
}

module.exports = AvaliacaoModel;