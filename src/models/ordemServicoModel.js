const pool = require('../config/database');
const UsuarioModel = require('./usuarioModel');

let colunasOSVerificadas = false;

async function garantirColunasOS(dbClient) {
  if (colunasOSVerificadas && !dbClient) return;
  const db = dbClient || pool;
  try {
    await db.query(`ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS data_entrega DATE;`);
    await db.query(`ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS status_pagamento VARCHAR(40) DEFAULT 'Aguardando Sinal';`);
    await db.query(`ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS fotos_andamento TEXT DEFAULT '[]';`);

    if (!dbClient) {
      await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_ordens_servico_id_pedido_unique ON ordens_servico (id_pedido);`);
      colunasOSVerificadas = true;
    }
  } catch (err) {
    console.error('Erro ao verificar colunas de ordens_servico:', err);
  }
}

class OrdemServicoModel {
  static async criar({ id_pedido, id_costureira, valor_total, previsao_entrega, status_kanban }) {
    await garantirColunasOS();
    const usuario = await UsuarioModel.buscarPorId(id_costureira);

    if (!usuario || (usuario.tipo_usuario !== 'Costureira' && usuario.tipo_usuario !== 'costureira')) {
      throw new Error('O ID informado para a costureira não pertence a um perfil de Costureira.');
    }

    const query = `
      INSERT INTO ordens_servico (id_pedido, id_costureira, valor_total, data_inicio, previsao_entrega, status_kanban, status_pagamento, fotos_andamento)
      VALUES ($1, $2, $3, NOW(), $4, $5, 'Aguardando Sinal', '[]')
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

  static async aceitarProposta(client, { id_pedido, id_costureira, valor_total, previsao_entrega, valor_entrada }) {
    await garantirColunasOS(client);
    const statusPagInicial = Number(valor_entrada) > 0 ? 'Aguardando Sinal' : 'Em Débito';

    const updateRes = await client.query(
      `UPDATE ordens_servico
       SET id_costureira = $2,
           valor_total = $3,
           previsao_entrega = $4,
           valor_entrada = $5,
           status_kanban = 'Em Produção',
           status_pagamento = COALESCE(status_pagamento, $6)
       WHERE id_pedido = $1
       RETURNING *;`,
      [
        id_pedido,
        id_costureira,
        valor_total || 0,
        previsao_entrega || null,
        valor_entrada || 0,
        statusPagInicial
      ]
    );

    let osRow = updateRes.rows[0];

    if (!osRow) {
      const insertRes = await client.query(
        `INSERT INTO ordens_servico (id_pedido, id_costureira, valor_total, previsao_entrega, valor_entrada, status_kanban, status_pagamento, fotos_andamento)
         VALUES ($1, $2, $3, $4, $5, 'Em Produção', $6, '[]')
         RETURNING *;`,
        [
          id_pedido,
          id_costureira,
          valor_total || 0,
          previsao_entrega || null,
          valor_entrada || 0,
          statusPagInicial
        ]
      );
      osRow = insertRes.rows[0];
    }

    await client.query(`UPDATE pedidos SET status_pedido = 'Em Produção' WHERE id_pedido = $1`, [id_pedido]);

    return osRow;
  }

  static async listarTodos() {
    await garantirColunasOS();
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

  static async buscarPorId(id_ordem_servico) {
    await garantirColunasOS();
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

  static async listarPorUsuario(idUsuario) {
    await garantirColunasOS();
    const query = `
      SELECT os.id_ordem_servico AS id, os.id_ordem_servico, os.id_pedido AS "idPedido", 
             os.valor_total AS "valorTotal", os.valor_entrada AS "valorEntrada",
             COALESCE(os.status_pagamento, 'Aguardando Sinal') AS status_pagamento,
             COALESCE(os.status_pagamento, 'Aguardando Sinal') AS "statusPagamento",
             COALESCE(os.fotos_andamento, '[]') AS fotos_andamento,
             os.data_inicio AS "dataInicio", 
             os.previsao_entrega, os.previsao_entrega AS "previsaoEntrega",
             os.data_entrega, os.data_entrega AS "dataEntrega",
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
      ORDER BY COALESCE(os.data_prova, os.data_entrega, os.previsao_entrega) ASC;
    `;
    const result = await pool.query(query, [idUsuario]);
    return result.rows.map((row) => {
      let fotos = [];
      try {
        fotos = typeof row.fotos_andamento === 'string' ? JSON.parse(row.fotos_andamento) : (row.fotos_andamento || []);
      } catch {
        fotos = [];
      }
      return { ...row, fotosAndamento: Array.isArray(fotos) ? fotos : [] };
    });
  }

  static async atualizarStatus(clientOrPool, idOrdem, status_kanban) {
    const db = clientOrPool || pool;
    await garantirColunasOS(db);

    const query = `
      UPDATE ordens_servico 
      SET status_kanban = $1,
          data_entrega = CASE 
            WHEN $1 = 'Entregue' THEN COALESCE(data_entrega, (NOW() AT TIME ZONE 'America/Sao_Paulo')::date)
            ELSE NULL
          END
      WHERE id_ordem_servico = $2 
      RETURNING *;
    `;
    const result = await db.query(query, [status_kanban, idOrdem]);

    if (result.rowCount === 0) return null;

    const ordem = result.rows[0];
    await db.query(`UPDATE pedidos SET status_pedido = $1 WHERE id_pedido = $2`, [status_kanban, ordem.id_pedido]);

    return ordem;
  }

  static async atualizarPagamento(idOrdem, status_pagamento) {
    await garantirColunasOS();
    const query = `
      UPDATE ordens_servico
      SET status_pagamento = $1
      WHERE id_ordem_servico = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [status_pagamento, idOrdem]);
    return result.rows[0] || null;
  }

  static async buscarPorPedido(idPedido) {
    await garantirColunasOS();
    const query = `
      SELECT id_ordem_servico, id_pedido, valor_total, valor_entrada,
             COALESCE(status_pagamento, 'Aguardando Sinal') AS status_pagamento,
             status_kanban
      FROM ordens_servico
      WHERE id_pedido = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [idPedido]);
    return result.rows[0] || null;
  }

  static async atualizarPagamentoPorPedido(idPedido, status_pagamento) {
    await garantirColunasOS();
    const query = `
      UPDATE ordens_servico
      SET status_pagamento = $1
      WHERE id_pedido = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [status_pagamento, idPedido]);
    return result.rows[0] || null;
  }

  static async adicionarFotoAndamento(idOrdem, { url_imagem, legenda }) {
    await garantirColunasOS();
    const atualRes = await pool.query(
      `SELECT COALESCE(fotos_andamento, '[]') AS fotos_andamento FROM ordens_servico WHERE id_ordem_servico = $1;`,
      [idOrdem]
    );
    if (atualRes.rowCount === 0) return null;

    let lista = [];
    try {
      lista = JSON.parse(atualRes.rows[0].fotos_andamento || '[]');
      if (!Array.isArray(lista)) lista = [];
    } catch {
      lista = [];
    }

    const novaFoto = {
      id: Date.now(),
      url: url_imagem,
      legenda: (legenda || '').trim(),
      data: new Date().toISOString()
    };

    lista.push(novaFoto);

    const updRes = await pool.query(
      `UPDATE ordens_servico SET fotos_andamento = $1 WHERE id_ordem_servico = $2 RETURNING *;`,
      [JSON.stringify(lista), idOrdem]
    );

    return { ordem: updRes.rows[0], fotosAndamento: lista };
  }

  static async removerFotoAndamento(idOrdem, idFoto) {
    await garantirColunasOS();
    const atualRes = await pool.query(
      `SELECT COALESCE(fotos_andamento, '[]') AS fotos_andamento FROM ordens_servico WHERE id_ordem_servico = $1;`,
      [idOrdem]
    );
    if (atualRes.rowCount === 0) return null;

    let lista = [];
    try {
      lista = JSON.parse(atualRes.rows[0].fotos_andamento || '[]');
      if (!Array.isArray(lista)) lista = [];
    } catch {
      lista = [];
    }

    const filtrada = lista.filter((f) => String(f.id) !== String(idFoto));

    const updRes = await pool.query(
      `UPDATE ordens_servico SET fotos_andamento = $1 WHERE id_ordem_servico = $2 RETURNING *;`,
      [JSON.stringify(filtrada), idOrdem]
    );

    return { ordem: updRes.rows[0], fotosAndamento: filtrada };
  }

  static async buscarClientePorPedido(idPedido) {
    const pedRes = await pool.query('SELECT id_cliente FROM pedidos WHERE id_pedido = $1', [idPedido]);
    return pedRes.rows[0]?.id_cliente || null;
  }
}

module.exports = OrdemServicoModel;