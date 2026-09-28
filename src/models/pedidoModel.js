const db = require('../config/database');

class PedidoModel {
  static async criar({ id_cliente, descricao, fotos_referencia, prazo_desejado, status_pedido }) {
    const statusInicial = status_pedido || 'Aberto';
    const query = `
      INSERT INTO pedidos (id_cliente, descricao, fotos_referencia, data_publicacao, prazo_desejado, status_pedido) 
      VALUES (?, ?, ?, NOW(), ?, ?)
    `;
    const [result] = await db.query(query, [
      id_cliente, 
      descricao, 
      fotos_referencia, 
      prazo_desejado, 
      statusInicial
    ]);
    return result.insertId;
  }

  static async listarTodos() {
    const [rows] = await db.query(`
      SELECT p.*, u.nome as nome_cliente 
      FROM pedidos p
      JOIN usuarios u ON p.id_cliente = u.id_usuario
    `);
    return rows;
  }

  static async buscarPorId(id_pedido) {
    const [rows] = await db.query('SELECT * FROM pedidos WHERE id_pedido = ?', [id_pedido]);
    return rows[0];
  }

  static async atualizarStatus(id_pedido, status_pedido) {
    await db.query(
      'UPDATE pedidos SET status_pedido = ? WHERE id_pedido = ?', 
      [status_pedido, id_pedido]
    );
  }
}

module.exports = PedidoModel;