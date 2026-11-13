const pool = require('../config/database');

let colunaDataEntregaVerificada = false;

async function garantirColunaDataEntrega() {
  if (colunaDataEntregaVerificada) return;
  try {
    await pool.query(`ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS data_entrega DATE;`);

    // Preenche data_entrega para pedidos já marcados como Entregue que ainda estavam NULL
    await pool.query(`
      UPDATE ordens_servico os
      SET data_entrega = COALESCE(
        (
          SELECT (m.data_hora_envio - INTERVAL '3 hours')::date
          FROM mensagens_chat m
          WHERE m.id_pedido = os.id_pedido
            AND m.conteudo LIKE '%ENTREGA CONFIRMADA%'
          ORDER BY m.data_hora_envio DESC
          LIMIT 1
        ),
        os.previsao_entrega,
        CURRENT_DATE
      )
      WHERE os.status_kanban = 'Entregue'
        AND os.data_entrega IS NULL;
    `);

    colunaDataEntregaVerificada = true;
  } catch (err) {
    console.error('Erro ao verificar coluna data_entrega:', err);
  }
}

class UsuarioModel {
  static async buscarPorEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await pool.query(query, [email ? email.trim() : '']);
    return result.rows[0];
  }

  static async buscarPorId(id_usuario) {
    const query = `
      SELECT id_usuario AS id, id_usuario, nome, email, telefone, tipo_usuario, 
             cpf_cnpj, endereco, bio, especialidades, foto_perfil 
      FROM usuarios 
      WHERE id_usuario = $1
    `;
    const result = await pool.query(query, [id_usuario]);
    return result.rows[0];
  }

  static async criarUsuario({ nome, email, senhaHash, telefone, cpf_cnpj, perfil }) {
    const query = `
      INSERT INTO usuarios (nome, email, senha, telefone, cpf_cnpj, tipo_usuario) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id_usuario AS id, id_usuario, nome, email, tipo_usuario, telefone
    `;
    const result = await pool.query(query, [nome, email.trim(), senhaHash, telefone.trim(), cpf_cnpj || null, perfil]);
    const novoUser = result.rows[0];

    await pool.query(
      'INSERT INTO configuracoes_notificacoes (id_usuario) VALUES ($1) ON CONFLICT DO NOTHING', 
      [novoUser.id_usuario]
    );

    return novoUser;
  }

  static async salvarTokenRedefinicao(idUsuario, token, expiracao) {
    const query = 'UPDATE usuarios SET token_redefinicao = $1, token_expiracao = $2 WHERE id_usuario = $3';
    await pool.query(query, [token, expiracao, idUsuario]);
  }

  static async buscarPorTokenRedefinicao(token) {
    const query = 'SELECT * FROM usuarios WHERE token_redefinicao = $1';
    const result = await pool.query(query, [token ? token.trim() : '']);
    return result.rows[0];
  }

  static async atualizarSenha(idUsuario, senhaHash) {
    const query = `
      UPDATE usuarios 
      SET senha = $1, token_redefinicao = NULL, token_expiracao = NULL 
      WHERE id_usuario = $2
    `;
    await pool.query(query, [senhaHash, idUsuario]);
  }

  // --- ATUALIZAR PERFIL ---
  static async atualizarPerfil(idUsuario, { nome, telefone, bio, especialidades, foto_perfil }) {
    const query = `
      UPDATE usuarios 
      SET nome = $1, telefone = $2, bio = $3, especialidades = $4, foto_perfil = $5
      WHERE id_usuario = $6
      RETURNING id_usuario AS id, id_usuario, nome, email, telefone, bio, especialidades, foto_perfil, tipo_usuario;
    `;
    const result = await pool.query(query, [
      nome, 
      telefone || null, 
      bio || null, 
      especialidades || null, 
      foto_perfil || null, 
      idUsuario
    ]);
    return result.rows[0];
  }

  // --- AGENDA UNIFICADA (TODAS AS PROVAS + ENTREGAS PREVISTAS/REAIS) ---
  static async buscarAgendaUsuario(idUsuario) {
    await garantirColunaDataEntrega();
    const query = `
      SELECT * FROM (
        -- 1. Todas as provas agendadas
        SELECT 
          ('prova-' || ap.id_prova) AS id_evento,
          'prova' AS tipo_evento,
          TO_CHAR(ap.data_prova, 'YYYY-MM-DD') AS data_evento,
          NULL::text AS data_entrega,
          ap.horario_prova AS horario_evento,
          ap.observacao AS observacao_evento,
          ap.id_pedido,
          COALESCE(os.status_kanban, p.status_pedido, 'Aguardando Prova') AS status_kanban,
          p.descricao AS pedido_descricao,
          cli.nome AS cliente_nome,
          cli.telefone AS cliente_telefone,
          cost.nome AS costureira_nome,
          cost.telefone AS costureira_telefone
        FROM agendamentos_prova ap
        JOIN pedidos p ON ap.id_pedido = p.id_pedido
        JOIN usuarios cli ON p.id_cliente = cli.id_usuario
        LEFT JOIN ordens_servico os ON os.id_pedido = p.id_pedido
        LEFT JOIN usuarios cost ON COALESCE(ap.id_costureira, os.id_costureira) = cost.id_usuario
        WHERE (COALESCE(ap.id_costureira, os.id_costureira) = $1 OR p.id_cliente = $1)
          AND COALESCE(ap.status, 'Agendada') <> 'Cancelada'
          AND COALESCE(p.status_pedido, '') <> 'Cancelado'

        UNION ALL

        -- 2. Entregas (prioriza data_entrega real quando já entregue)
        SELECT 
          ('entrega-' || os.id_ordem_servico) AS id_evento,
          'entrega' AS tipo_evento,
          TO_CHAR(
            CASE 
              WHEN os.status_kanban = 'Entregue' AND os.data_entrega IS NOT NULL THEN os.data_entrega
              ELSE os.previsao_entrega
            END,
            'YYYY-MM-DD'
          ) AS data_evento,
          TO_CHAR(os.data_entrega, 'YYYY-MM-DD') AS data_entrega,
          NULL AS horario_evento,
          NULL AS observacao_evento,
          os.id_pedido,
          os.status_kanban,
          p.descricao AS pedido_descricao,
          cli.nome AS cliente_nome,
          cli.telefone AS cliente_telefone,
          cost.nome AS costureira_nome,
          cost.telefone AS costureira_telefone
        FROM ordens_servico os
        JOIN pedidos p ON os.id_pedido = p.id_pedido
        JOIN usuarios cli ON p.id_cliente = cli.id_usuario
        LEFT JOIN usuarios cost ON os.id_costureira = cost.id_usuario
        WHERE (os.id_costureira = $1 OR p.id_cliente = $1)
          AND COALESCE(os.data_entrega, os.previsao_entrega) IS NOT NULL
          AND os.status_kanban NOT IN ('Cancelado')
      ) eventos
      ORDER BY data_evento ASC;
    `;
    const result = await pool.query(query, [idUsuario]);
    return result.rows;
  }

  // --- MEDIDAS ---
  static async buscarMedidas(idUsuario) {
    const query = 'SELECT busto, cintura, quadril, altura, comprimento, observacoes_medidas FROM usuarios WHERE id_usuario = $1';
    const result = await pool.query(query, [idUsuario]);
    return result.rows[0];
  }

  static async atualizarMedidas(idUsuario, { busto, cintura, quadril, altura, comprimento, observacoes_medidas }) {
    const query = `
      UPDATE usuarios 
      SET busto = $1, cintura = $2, quadril = $3, altura = $4, comprimento = $5, observacoes_medidas = $6 
      WHERE id_usuario = $7
    `;
    await pool.query(query, [
      busto || null, 
      cintura || null, 
      quadril || null, 
      altura || null, 
      comprimento || null, 
      observacoes_medidas || null, 
      idUsuario
    ]);
  }

  // --- CONFIGURAÇÕES DE NOTIFICAÇÕES ---
  static async buscarConfigNotificacoes(idUsuario) {
    let query = 'SELECT * FROM configuracoes_notificacoes WHERE id_usuario = $1';
    let result = await pool.query(query, [idUsuario]);
    
    if (result.rows.length === 0) {
      query = 'INSERT INTO configuracoes_notificacoes (id_usuario) VALUES ($1) RETURNING *';
      result = await pool.query(query, [idUsuario]);
    }
    
    return result.rows[0];
  }

  static async atualizarConfigNotificacoes(idUsuario, config) {
    const { 
      receber_whatsapp, notif_proposta, notif_chat, notif_prova, 
      notif_status, notif_lembrete, notif_avaliacao, notif_cancelamento 
    } = config;

    const query = `
      UPDATE configuracoes_notificacoes 
      SET receber_whatsapp = $1, notif_proposta = $2, notif_chat = $3, notif_prova = $4, 
          notif_status = $5, notif_lembrete = $6, notif_avaliacao = $7, notif_cancelamento = $8
      WHERE id_usuario = $9
    `;
    await pool.query(query, [
      receber_whatsapp, notif_proposta, notif_chat, notif_prova, 
      notif_status, notif_lembrete, notif_avaliacao, notif_cancelamento, idUsuario
    ]);
  }
}

module.exports = UsuarioModel;