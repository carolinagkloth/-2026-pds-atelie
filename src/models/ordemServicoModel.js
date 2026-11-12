const pool = require('../config/database');
const UsuarioModel = require('./usuarioModel');

class OrdemServicoModel {
  // Criar Ordem de Serviço isolada com validação de Costureira
  static async criar({ id_pedido, id_costureira, valor_total, previsao_entrega, status_kanban }) {
    const usuario = await UsuarioModel.buscarPorId(id_costureira);

    if (!usuario || (usuario.tipo_usuario !== 'Costureira' && usuario.tipo_usuario !== 'costureira')) {
      throw new Error('O ID informado para a costureira não pertence a um perfil de Costureira.');
    }

    const query = `
      INSERT INTO ordens_servico (id_pedido, id_costureira, valor_total, data_inicio, previsao_entrega, status_kanban)
      VALUES ($1, $2, $3, NOW(), $4, $5)
      RETURNING *;
    `;
    const statusInicial = status_kanban || 'A Fazer';
    const result = await pool.query(query, [
      id_pedido,
      id_costureira,
      valor_total || 0,
      previsao_entrega || null,
      statusInicial
    ]);
    return result.rows[0];
  }

  // Aceitar Proposta e Gerar OS (Preserva data_prova caso já tenha sido agendada)
  static async aceitarProposta(client, { id_pedido, id_costureira, valor_total, previsao_entrega, valor_entrada }) {
    const queryOS = `
      INSERT INTO ordens_servico (id_pedido, id_costureira, valor_total, previsao_entrega, valor_entrada, status_kanban)
      VALUES ($1, $2, $3, $4, $5, 'Em Produção')
      ON CONFLICT (id_pedido) DO UPDATE SET 
        id_costureira = $2,
        valor_total = $3, 
        previsao_entrega = $4, 
        valor_entrada = $5, 
        status_kanban = 'Em Produção'
      RETURNING *;
    `;
    const osResult = await client.query(queryOS, [
      id_pedido, 
      id_costureira, 
      valor_total || 0, 
      previsao_entrega || null, 
      valor_entrada || 0
    ]);

    await client.query(`UPDATE pedidos SET status_pedido = 'Em Produção' WHERE id_pedido = $1`, [id_pedido]);

    return osResult.rows[0];
  }

  // Listar todas as Ordens de Serviço
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
    const result = await pool.query(query);
    return result.rows;
  }

  // Buscar Ordem por ID da OS
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
      WHERE os.id_ordem_servico = $1
    `;
    const result = await pool.query(query, [id_ordem_servico]);
    return result.rows[0];
  }

  // Listar Ordens por Usuário (Cliente ou Costureira) com Prova e Entrega
  static async listarPorUsuario(idUsuario) {
    const query = `
      SELECT os.id_ordem_servico AS id, os.id_ordem_servico, os.id_pedido AS "idPedido", 
             os.valor_total AS "valorTotal", os.valor_entrada AS "valorEntrada",
             os.data_inicio AS "dataInicio", 
             os.previsao_entrega, os.previsao_entrega AS "previsaoEntrega", 
             os.data_prova, os.data_prova AS "dataProva",
             os.horario_prova, os.horario_prova AS "horarioProva",
             os.status_kanban, os.status_kanban AS "statusKanban",
             p.descricao AS pedido_descricao, p.descricao AS "pedidoDescricao", 
             cli.nome AS cliente_nome, cli.nome AS "clienteNome", cli.telefone AS "clienteTelefone",
             cost.nome AS costureira_nome, cost.nome AS "costureiraNome", cost.telefone AS "costureiraTelefone"
      FROM ordens_servico os
      JOIN pedidos p ON os.id_pedido = p.id_pedido
      JOIN usuarios cli ON p.id_cliente = cli.id_usuario
      LEFT JOIN usuarios cost ON os.id_costureira = cost.id_usuario
      WHERE (p.id_cliente = $1 OR os.id_costureira = $1)
        AND os.status_kanban NOT IN ('Cancelado')
      ORDER BY COALESCE(os.data_prova, os.previsao_entrega) ASC;
    `;
    const result = await pool.query(query, [idUsuario]);
    return result.rows;
  }

  // Atualizar Status Kanban
  static async atualizarStatus(clientOrPool, idOrdem, status_kanban) {
    const query = `UPDATE ordens_servico SET status_kanban = $1 WHERE id_ordem_servico = $2 RETURNING *;`;
    const db = clientOrPool || pool;
    const result = await db.query(query, [status_kanban, idOrdem]);

    if (result.rowCount === 0) return null;

    const ordem = result.rows[0];
    await db.query(`UPDATE pedidos SET status_pedido = $1 WHERE id_pedido = $2`, [status_kanban, ordem.id_pedido]);

    return ordem;
  }

  static async buscarClientePorPedido(idPedido) {
    const pedRes = await pool.query('SELECT id_cliente FROM pedidos WHERE id_pedido = $1', [idPedido]);
    return pedRes.rows[0]?.id_cliente || null;
  }
}

module.exports = OrdemServicoModel;