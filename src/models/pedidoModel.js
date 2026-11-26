const pool = require('../config/database');

let colunaHorarioVerificada = false;

async function garantirColunaHorario() {
  if (colunaHorarioVerificada) return;
  try {
    await pool.query(`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS horario_limite VARCHAR(25);`);
    colunaHorarioVerificada = true;
  } catch (err) {
    console.warn('Aviso ao verificar coluna horario_limite:', err.message);
  }
}

class PedidoModel {
  static async criar({ id_cliente, descricao, fotos_referencia, prazo_desejado, horario_limite, status_pedido }) {
    await garantirColunaHorario();
    const statusInicial = status_pedido || 'Aberto';
    const query = `
      INSERT INTO pedidos (id_cliente, descricao, fotos_referencia, data_publicacao, prazo_desejado, horario_limite, status_pedido) 
      VALUES ($1, $2, $3, NOW(), $4, $5, $6)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      id_cliente,
      descricao,
      fotos_referencia || null,
      prazo_desejado,
      horario_limite || null,
      statusInicial
    ]);
    return result.rows[0];
  }

  static async listarTodos() {
    await garantirColunaHorario();
    const query = `
      SELECT p.id_pedido AS id, p.id_pedido, p.descricao, p.fotos_referencia AS "fotoReferencia", 
             p.data_publicacao AS "dataPublicacao", p.prazo_desejado AS "prazoDesejado", p.prazo_desejado,
             p.horario_limite AS "horarioLimite", p.horario_limite,
             p.status_pedido AS status, p.status_pedido, u.nome AS "clienteNome", u.nome AS nome_cliente, 
             u.id_usuario AS "clienteId", u.id_usuario AS id_cliente,
             COALESCE(u.endereco, 'Não informado') AS localizacao
      FROM pedidos p 
      JOIN usuarios u ON p.id_cliente = u.id_usuario
      ORDER BY p.data_publicacao DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async buscarPorId(id_pedido) {
    await garantirColunaHorario();
    const query = `
      SELECT *, 
             prazo_desejado AS "prazoDesejado",
             horario_limite AS "horarioLimite"
      FROM pedidos 
      WHERE id_pedido = $1
    `;
    const result = await pool.query(query, [id_pedido]);
    return result.rows[0];
  }

  static async atualizar(id_pedido, id_cliente, { descricao, fotos_referencia, prazo_desejado, horario_limite }) {
    await garantirColunaHorario();
    const query = `
      UPDATE pedidos 
      SET descricao = $1, fotos_referencia = $2, prazo_desejado = $3, horario_limite = $4
      WHERE id_pedido = $5 AND id_cliente = $6 
      RETURNING *;
    `;
    const result = await pool.query(query, [
      descricao.trim(),
      fotos_referencia || null,
      prazo_desejado,
      horario_limite || null,
      id_pedido,
      id_cliente
    ]);
    return result.rows[0];
  }

  static async atualizarStatus(id_pedido, status_pedido) {
    const query = 'UPDATE pedidos SET status_pedido = $1 WHERE id_pedido = $2 RETURNING *;';
    const result = await pool.query(query, [status_pedido, id_pedido]);
    return result.rows[0];
  }

  static async deletar(id_pedido) {
    const query = 'DELETE FROM pedidos WHERE id_pedido = $1';
    await pool.query(query, [id_pedido]);
  }

  static async buscarCostureiraVinculada(id_pedido) {
    const osRes = await pool.query(
      'SELECT id_costureira FROM ordens_servico WHERE id_pedido = $1 AND id_costureira IS NOT NULL LIMIT 1',
      [id_pedido]
    );
    if (osRes.rows[0]?.id_costureira) {
      return osRes.rows[0].id_costureira;
    }

    const chatRes = await pool.query(
      `SELECT m.id_remetente
       FROM mensagens_chat m
       JOIN pedidos p ON m.id_pedido = p.id_pedido
       WHERE m.id_pedido = $1 AND m.id_remetente != p.id_cliente
       ORDER BY m.data_hora_envio DESC
       LIMIT 1`,
      [id_pedido]
    );
    return chatRes.rows[0]?.id_remetente || null;
  }
}

module.exports = PedidoModel;