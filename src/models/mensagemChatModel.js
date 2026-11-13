const pool = require('../config/database');

let colunaLidaVerificada = false;

async function garantirColunaLida() {
  if (colunaLidaVerificada) return;
  try {
    await pool.query(`ALTER TABLE mensagens_chat ADD COLUMN IF NOT EXISTS lida BOOLEAN DEFAULT FALSE;`);
    colunaLidaVerificada = true;
  } catch (err) {
    console.error('Erro ao verificar coluna lida:', err);
  }
}

class MensagemChatModel {
  static async criar({ id_pedido, id_remetente, conteudo, tipo_mensagem, dados_proposta, valor_proposta, prazo_proposta, valor_entrada }) {
    await garantirColunaLida();
    const query = `
      INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem, dados_proposta, valor_proposta, prazo_proposta, valor_entrada, data_hora_envio, lida)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), false)
      RETURNING *;
    `;
    const dadosJson = dados_proposta ? (typeof dados_proposta === 'string' ? dados_proposta : JSON.stringify(dados_proposta)) : null;

    const result = await pool.query(query, [
      id_pedido, 
      id_remetente, 
      conteudo, 
      tipo_mensagem || 'texto',
      dadosJson, 
      valor_proposta || null, 
      prazo_proposta || null, 
      valor_entrada || 0
    ]);
    return result.rows[0];
  }

  static async listarPorPedido(id_pedido) {
    await garantirColunaLida();
    const query = `
      SELECT m.id_mensagem AS id, m.id_mensagem, m.id_pedido AS "idPedido", m.id_pedido, 
             m.id_remetente AS "idRemetente", m.id_remetente, u.nome AS "remetente_nome", 
             u.nome AS "nomeRemetente", u.nome AS nome_remetente, u.foto_perfil AS "fotoRemetente",
             m.conteudo, m.tipo_mensagem, m.dados_proposta, m.valor_proposta AS "valorProposta",
             m.prazo_proposta AS "prazoProposta", m.valor_entrada AS "valorEntrada", m.data_hora_envio AS "dataHoraEnvio",
             COALESCE(m.lida, false) AS lida
      FROM mensagens_chat m 
      JOIN usuarios u ON m.id_remetente = u.id_usuario
      WHERE m.id_pedido = $1 
      ORDER BY m.data_hora_envio ASC;
    `;
    const result = await pool.query(query, [id_pedido]);
    return result.rows;
  }

  static async marcarComoLidas(id_pedido, id_usuario_leitor) {
    if (!id_pedido || !id_usuario_leitor) return;
    await garantirColunaLida();
    await pool.query(
      `UPDATE mensagens_chat
       SET lida = true
       WHERE id_pedido = $1
         AND id_remetente != $2
         AND COALESCE(lida, false) = false;`,
      [id_pedido, id_usuario_leitor]
    );
  }

  static async buscarConversasUsuario(idUsuario) {
    await garantirColunaLida();
    const query = `
      SELECT p.id_pedido AS "idPedido", p.id_pedido AS id, p.descricao, 
             COALESCE(os.status_kanban, p.status_pedido) AS status, p.prazo_desejado AS "prazoDesejado",
             cli.id_usuario AS "clienteId", cli.nome AS "clienteNome", cost.id_usuario AS "costureiraId", cost.nome AS "costureiraNome",
             (SELECT conteudo FROM mensagens_chat WHERE id_pedido = p.id_pedido ORDER BY data_hora_envio DESC LIMIT 1) AS "ultimaMensagem",
             (SELECT data_hora_envio FROM mensagens_chat WHERE id_pedido = p.id_pedido ORDER BY data_hora_envio DESC LIMIT 1) AS "dataUltimaAtividade",
             (SELECT COUNT(*)::int FROM mensagens_chat WHERE id_pedido = p.id_pedido AND id_remetente != $1 AND COALESCE(lida, false) = false) AS "naoLidas"
      FROM pedidos p
      JOIN usuarios cli ON p.id_cliente = cli.id_usuario
      LEFT JOIN ordens_servico os ON os.id_pedido = p.id_pedido
      LEFT JOIN usuarios cost ON os.id_costureira = cost.id_usuario
      WHERE (p.id_cliente = $1 OR os.id_costureira = $1 OR EXISTS (SELECT 1 FROM mensagens_chat m WHERE m.id_pedido = p.id_pedido AND m.id_remetente = $1))
        AND EXISTS (SELECT 1 FROM mensagens_chat m WHERE m.id_pedido = p.id_pedido)
      ORDER BY "dataUltimaAtividade" DESC;
    `;
    const result = await pool.query(query, [idUsuario]);
    return result.rows;
  }
}

module.exports = MensagemChatModel;