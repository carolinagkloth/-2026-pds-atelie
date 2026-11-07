const pool = require('../config/database');

class MensagemChatModel {
  static async criar({ id_pedido, id_remetente, conteudo, tipo_mensagem, dados_proposta, valor_proposta, prazo_proposta, valor_entrada }) {
    const query = `
      INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem, dados_proposta, valor_proposta, prazo_proposta, valor_entrada, data_hora_envio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
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
    const query = `
      SELECT m.id_mensagem AS id, m.id_mensagem, m.id_pedido AS "idPedido", m.id_pedido, 
             m.id_remetente AS "idRemetente", m.id_remetente, u.nome AS "remetente_nome", 
             u.nome AS "nomeRemetente", u.nome AS nome_remetente, u.foto_perfil AS "fotoRemetente",
             m.conteudo, m.tipo_mensagem, m.dados_proposta, m.valor_proposta AS "valorProposta",
             m.prazo_proposta AS "prazoProposta", m.valor_entrada AS "valorEntrada", m.data_hora_envio AS "dataHoraEnvio"
      FROM mensagens_chat m 
      JOIN usuarios u ON m.id_remetente = u.id_usuario
      WHERE m.id_pedido = $1 
      ORDER BY m.data_hora_envio ASC;
    `;
    const result = await pool.query(query, [id_pedido]);
    return result.rows;
  }

  static async buscarConversasUsuario(idUsuario) {
    const query = `
      SELECT p.id_pedido AS "idPedido", p.id_pedido AS id, p.descricao, 
             COALESCE(os.status_kanban, p.status_pedido) AS status, p.prazo_desejado AS "prazoDesejado",
             cli.id_usuario AS "clienteId", cli.nome AS "clienteNome", cost.id_usuario AS "costureiraId", cost.nome AS "costureiraNome",
             (SELECT conteudo FROM mensagens_chat WHERE id_pedido = p.id_pedido ORDER BY data_hora_envio DESC LIMIT 1) AS "ultimaMensagem",
             (SELECT data_hora_envio FROM mensagens_chat WHERE id_pedido = p.id_pedido ORDER BY data_hora_envio DESC LIMIT 1) AS "dataUltimaAtividade"
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