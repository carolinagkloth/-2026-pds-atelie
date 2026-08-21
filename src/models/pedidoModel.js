const db = require('../config/database');

class PedidoModel {
  static async create({ id_cliente, descricao, fotos_referencia, prazo_desejado }) {
    const [result] = await db.query(
      'INSERT INTO pedidos (id_cliente, descricao, fotos_referencia, prazo_desejado) VALUES (?, ?, ?, ?)',
      [id_cliente, descricao, fotos_referencia, prazo_desejado]
    );
    return result.insertId;
  }

  static async findAll() {
    const [rows] = await db.query(`
      SELECT p.*, u.nome as nome_cliente 
      FROM pedidos p
      JOIN usuarios u ON p.id_cliente = u.id_usuario
    `);
    return rows;
  }

  static async updateStatus(id_pedido, status_pedido) {
    await db.query(
      'UPDATE pedidos SET status_pedido = ? WHERE id_pedido = ?', 
      [status_pedido, id_pedido]
    );
  }
}

module.exports = PedidoModel;