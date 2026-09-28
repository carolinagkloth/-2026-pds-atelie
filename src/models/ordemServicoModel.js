const db = require('../config/database');
const UsuarioModel = require('./usuarioModel');

class OrdemServicoModel {
  static async criar({ id_pedido, id_costureira, valor_total, previsao_entrega, status_kanban }) {
    const usuario = await UsuarioModel.buscarPorId(id_costureira);

    if (!usuario || usuario.tipo_usuario !== 'Costureira') {
      throw new Error('O ID informado para a costureira não pertence a um perfil de Costureira.');
    }

    const query = `
      INSERT INTO ordens_servico (id_pedido, id_costureira, valor_total, data_inicio, previsao_entrega, status_kanban)
      VALUES (?, ?, ?, NOW(), ?, ?)
    `;
    const statusInicial = status_kanban || 'A Fazer';
    const [resultado] = await db.execute(query, [
      id_pedido,
      id_costureira,
      valor_total,
      previsao_entrega || null,
      statusInicial
    ]);
    return resultado.insertId;
  }

  static async listarTodos() {
    const query = `
      SELECT 
        os.*,
        p.descricao AS pedido_descricao,
        u_cli.nome AS cliente_nome,
        u_cos.nome AS costureira_nome
      FROM ordens_servico os
      INNER JOIN pedidos p ON os.id_pedido = p.id_pedido
      LEFT JOIN usuarios u_cli ON p.id_cliente = u_cli.id_usuario
      LEFT JOIN usuarios u_cos ON os.id_costureira = u_cos.id_usuario;
    `;
    const [linhas] = await db.execute(query);
    return linhas;
  }

  static async buscarPorId(id_ordem_servico) {
    const query = `
      SELECT 
        os.*,
        p.descricao AS pedido_descricao,
        cli.nome AS cliente_nome,
        cost.nome AS costureira_nome
      FROM ordens_servico os
      JOIN pedidos p ON os.id_pedido = p.id_pedido
      JOIN usuarios cli ON p.id_cliente = cli.id_usuario
      JOIN usuarios cost ON os.id_costureira = cost.id_usuario
      WHERE os.id_ordem_servico = ?
    `;
    const [linhas] = await db.execute(query, [id_ordem_servico]);
    return linhas[0];
  }

  static async atualizarStatus(id_ordem_servico, status_kanban) {
    const query = `
      UPDATE ordens_servico 
      SET status_kanban = ? 
      WHERE id_ordem_servico = ?
    `;
    const [resultado] = await db.execute(query, [status_kanban, id_ordem_servico]);
    return resultado.affectedRows > 0;
  }
}

module.exports = OrdemServicoModel;