require('dotenv').config();
const { enviarEmailNovoAcesso } = require('./emailService');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Conexão com o banco de dados PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const EMAIL_OFICIAL = process.env.EMAIL_USER || 'noreply.atelie.entre.linhas@gmail.com';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: EMAIL_OFICIAL,
    pass: process.env.EMAIL_PASS
  }
});

// 1. Google OAuth 2.0
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ erro: 'Token não fornecido.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    let usuario = result.rows[0];

    // Se o usuário ainda não existe no banco, avisa o frontend para concluir o cadastro
    if (!usuario) {
      return res.json({
        novoUsuario: true,
        dadosGoogle: {
          nome: name,
          email: email,
          foto_perfil: picture || null
        }
      });
    }

    enviarEmailNovoAcesso(usuario.email, usuario.nome, pool);

    return res.json({
      novoUsuario: false,
      mensagem: 'Login realizado com sucesso!',
      usuario: {
        id: usuario.id_usuario || usuario.id,
        id_usuario: usuario.id_usuario || usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario || 'Cliente',
        foto_perfil: usuario.foto_perfil || picture || null
      }
    });
  } catch (err) {
    console.error('Erro Google Auth:', err);
    return res.status(401).json({ erro: 'Credencial inválida do Google.' });
  }
});

// 2. Cadastro de Usuário
app.post('/api/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, telefone, cpf_cnpj, tipo_usuario } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    if (senha.length < 8) {
      return res.status(400).json({ erro: 'A senha deve conter no mínimo 8 caracteres.' });
    }

    const usuarioExistente = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.trim()]);
    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);
    const perfil = tipo_usuario || 'Cliente';

    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, telefone, cpf_cnpj, tipo_usuario) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id_usuario AS id, id_usuario, nome, email, tipo_usuario`,
      [nome, email.trim(), senhaHash, telefone || null, cpf_cnpj || null, perfil]
    );

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return res.status(500).json({ erro: 'Erro interno ao realizar cadastro.' });
  }
});

// 3. Login de Usuário
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Preencha o e-mail e a senha.' });
    }

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const usuario = result.rows[0];

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });
    }

    enviarEmailNovoAcesso(usuario.email, usuario.nome, pool);

    return res.json({
      mensagem: 'Login realizado com sucesso!',
      usuario: { 
        id: usuario.id_usuario || usuario.id, 
        id_usuario: usuario.id_usuario || usuario.id, 
        nome: usuario.nome, 
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario || 'Cliente',
        foto_perfil: usuario.foto_perfil || null
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// 4. E-mail de Recuperação de Senha
async function enviarEmailRecuperacao(emailUsuario, nomeUsuario, token) {
  if (!process.env.EMAIL_PASS) {
    throw new Error('Senha de app do e-mail não configurada no arquivo .env!');
  }

  const linkRedefinicao = `http://localhost:5173/?tela=redefinirSenha&token=${token}`;

  const mailOptions = {
    from: `"Ateliê Entre Linhas (Não responda)" <${EMAIL_OFICIAL}>`,
    replyTo: EMAIL_OFICIAL,
    to: emailUsuario,
    subject: 'Redefinição de Senha - Ateliê Entre Linhas',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f9f9f9; color: #333;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #eee;">
          <div style="background-color: #3E2445; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Ateliê Entre Linhas</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #3E2445; font-size: 18px; margin-top: 0;">Olá, ${nomeUsuario}!</h2>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Recebemos uma solicitação para redefinir a senha da sua conta no portal do Ateliê Entre Linhas.
            </p>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Clique no botão abaixo para cadastrar sua nova senha com segurança:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${linkRedefinicao}" target="_blank" style="background-color: #3E2445; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 14px;">
                Redefinir Minha Senha
              </a>
            </div>
            <p style="font-size: 12px; color: #888; line-height: 1.5; border-top: 1px solid #f0f0f0; padding-top: 15px;">
              Caso o botão não funcione, copie e cole este link no seu navegador:<br>
              <a href="${linkRedefinicao}" style="color: #3E2445; word-break: break-all;">${linkRedefinicao}</a>
            </p>
            <p style="font-size: 12px; color: #aaa; margin-top: 20px; margin-bottom: 0;">
              Este link é válido por 15 minutos. Se você não solicitou esta alteração, desconsidere este e-mail.<br>
              <em>Este é um e-mail automático. Por favor, não responda a esta mensagem.</em>
            </p>
          </div>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

app.post('/api/recuperar-senha', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ erro: 'Informe o seu e-mail.' });

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.trim()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Este e-mail não está cadastrado no sistema.' });
    }

    const usuario = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiracao = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'UPDATE usuarios SET token_redefinicao = $1, token_expiracao = $2 WHERE id_usuario = $3',
      [token, expiracao, usuario.id_usuario]
    );

    await enviarEmailRecuperacao(usuario.email, usuario.nome, token);

    return res.json({ mensagem: 'Enviamos um e-mail com o link para redefinir sua senha!' });
  } catch (err) {
    console.error('Erro na solicitação de recuperação:', err);
    return res.status(500).json({ erro: err.message || 'Erro ao enviar o e-mail de recuperação.' });
  }
});

app.post('/api/redefinir-senha', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    if (!token) {
      return res.status(400).json({ erro: 'Token de segurança ausente.' });
    }

    if (!novaSenha || novaSenha.length < 8) {
      return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 8 caracteres.' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE token_redefinicao = $1',
      [token.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ erro: 'O link de redefinição é inválido ou já foi utilizado.' });
    }

    const usuario = result.rows[0];
    const agora = new Date();
    const expiracao = new Date(usuario.token_expiracao);

    if (agora > expiracao) {
      return res.status(400).json({ erro: 'O link de redefinição expirou. Solicite um novo link.' });
    }

    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(novaSenha, saltRounds);

    await pool.query(
      `UPDATE usuarios 
       SET senha = $1, token_redefinicao = NULL, token_expiracao = NULL 
       WHERE id_usuario = $2`,
      [senhaHash, usuario.id_usuario]
    );

    return res.json({ mensagem: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// --- PERFIL DE USUÁRIO ---
app.get('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id_usuario AS id, id_usuario, nome, email, telefone, tipo_usuario, cpf_cnpj, endereco, bio, especialidades, foto_perfil FROM usuarios WHERE id_usuario = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    return res.status(500).json({ erro: 'Erro ao carregar dados do perfil.' });
  }
});

// --- MEDIDAS DO CLIENTE ---
app.get('/api/usuarios/:id/medidas', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT busto, cintura, quadril, altura, comprimento, observacoes_medidas FROM usuarios WHERE id_usuario = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar medidas:', err);
    res.status(500).json({ erro: 'Erro ao buscar medidas.' });
  }
});

app.put('/api/usuarios/:id/medidas', async (req, res) => {
  const { id } = req.params;
  const { busto, cintura, quadril, altura, comprimento, observacoes_medidas } = req.body;
  try {
    await pool.query(
      `UPDATE usuarios 
       SET busto = $1, cintura = $2, quadril = $3, altura = $4, comprimento = $5, observacoes_medidas = $6
       WHERE id_usuario = $7`,
      [
        busto || null,
        cintura || null,
        quadril || null,
        altura || null,
        comprimento || null,
        observacoes_medidas || null,
        id
      ]
    );
    res.json({ mensagem: 'Medidas e observações salvas com sucesso!' });
  } catch (err) {
    console.error('Erro ao salvar medidas:', err);
    res.status(500).json({ erro: 'Erro ao salvar medidas.' });
  }
});

// --- PEDIDOS ---
app.put('/api/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  const { id_cliente, descricao, fotos_referencia, prazo_desejado } = req.body;

  if (!descricao || !descricao.trim()) {
    return res.status(400).json({ erro: 'A descrição do pedido é obrigatória.' });
  }

  try {
    const checagem = await pool.query('SELECT status_pedido FROM pedidos WHERE id_pedido = $1', [id]);
    
    if (checagem.rows.length === 0) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' });
    }

    if (checagem.rows[0].status_pedido !== 'Aberto') {
      return res.status(400).json({ 
        erro: 'Não é possível editar um pedido que já teve proposta aceita ou está em produção.' 
      });
    }

    const queryUpdate = `
      UPDATE pedidos 
      SET descricao = $1, fotos_referencia = $2, prazo_desejado = $3
      WHERE id_pedido = $4 AND id_cliente = $5
      RETURNING *;
    `;
    const result = await pool.query(queryUpdate, [
      descricao.trim(), 
      fotos_referencia || null, 
      prazo_desejado, 
      id, 
      id_cliente
    ]);

    res.json({ mensagem: 'Pedido atualizado com sucesso!', pedido: result.rows[0] });

  } catch (err) {
    console.error('Erro ao editar pedido:', err);
    res.status(500).json({ erro: 'Erro interno ao atualizar pedido.' });
  }
});

app.get('/api/pedidos', async (req, res) => {
  try {
    const queryText = `
      SELECT 
        p.id_pedido AS id,
        p.descricao,
        p.fotos_referencia AS "fotoReferencia",
        p.data_publicacao AS "dataPublicacao",
        p.prazo_desejado AS "prazoDesejado",
        p.status_pedido AS status,
        u.nome AS "clienteNome",
        u.id_usuario AS "clienteId",
        COALESCE(u.endereco, 'Não informado') AS localizacao
      FROM pedidos p
      JOIN usuarios u ON p.id_cliente = u.id_usuario
      ORDER BY p.data_publicacao DESC;
    `;
    const result = await pool.query(queryText);
    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    return res.status(500).json({ erro: 'Erro ao buscar pedidos no servidor.' });
  }
});

app.post('/api/pedidos', async (req, res) => {
  const { id_cliente, descricao, fotos_referencia, prazo_desejado } = req.body;

  if (!id_cliente || !descricao || !prazo_desejado) {
    return res.status(400).json({ erro: 'Campos obrigatórios em falta.' });
  }

  try {
    const query = `
      INSERT INTO pedidos (id_cliente, descricao, fotos_referencia, prazo_desejado, status_pedido)
      VALUES ($1, $2, $3, $4, 'Aberto')
      RETURNING *;
    `;
    const result = await pool.query(query, [id_cliente, descricao, fotos_referencia || null, prazo_desejado]);
    res.status(201).json({ mensagem: 'Pedido criado com sucesso!', pedido: result.rows[0] });
  } catch (err) {
    console.error('Erro ao registar pedido:', err);
    res.status(500).json({ erro: 'Erro interno no servidor ao guardar o pedido.' });
  }
});

app.delete('/api/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM pedidos WHERE id_pedido = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' });
    }
    res.json({ mensagem: 'Pedido cancelado com sucesso!' });
  } catch (err) {
    console.error('Erro ao cancelar pedido:', err);
    res.status(500).json({ erro: 'Erro ao cancelar o pedido no servidor.' });
  }
});

// --- CHAT E NEGOCIAÇÃO ---
app.get(['/api/mensagens-chat/:idPedido', '/api/chat/:idPedido'], async (req, res) => {
  const { idPedido } = req.params;
  try {
    const query = `
      SELECT 
        m.id_mensagem AS id,
        m.id_mensagem,
        m.id_pedido AS "idPedido",
        m.id_pedido,
        m.id_remetente AS "idRemetente",
        m.id_remetente,
        u.nome AS "remetente_nome",
        u.nome AS "nomeRemetente",
        u.foto_perfil AS "fotoRemetente",
        m.conteudo,
        m.tipo_mensagem,
        m.dados_proposta,
        m.valor_proposta AS "valorProposta",
        m.prazo_proposta AS "prazoProposta",
        m.valor_entrada AS "valorEntrada",
        m.data_hora_envio AS "dataHoraEnvio"
      FROM mensagens_chat m
      JOIN usuarios u ON m.id_remetente = u.id_usuario
      WHERE m.id_pedido = $1
      ORDER BY m.data_hora_envio ASC;
    `;
    const result = await pool.query(query, [idPedido]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao carregar mensagens do chat:', err);
    res.status(500).json({ erro: 'Erro ao carregar histórico de mensagens.' });
  }
});

app.post(['/api/mensagens-chat', '/api/chat'], async (req, res) => {
  const { id_pedido, id_remetente, conteudo, tipo_mensagem, dados_proposta, valor_proposta, prazo_proposta, valor_entrada } = req.body;

  if (!id_pedido || !id_remetente || !conteudo) {
    return res.status(400).json({ erro: 'Pedido, remetente e conteúdo são obrigatórios.' });
  }

  try {
    const query = `
      INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem, dados_proposta, valor_proposta, prazo_proposta, valor_entrada)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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

    res.status(201).json({ mensagem: 'Mensagem enviada com sucesso!', item: result.rows[0], ...result.rows[0] });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    res.status(500).json({ erro: `Erro ao salvar mensagem: ${err.message}` });
  }
});

// Central de Conversas
app.get('/api/conversas/usuario/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const query = `
      SELECT 
        p.id_pedido AS "idPedido",
        p.id_pedido AS id,
        p.descricao,
        p.status_pedido AS status,
        p.prazo_desejado AS "prazoDesejado",
        cli.id_usuario AS "clienteId",
        cli.nome AS "clienteNome",
        cost.id_usuario AS "costureiraId",
        cost.nome AS "costureiraNome",
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
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar conversas:', err);
    res.status(500).json({ erro: `Erro ao carregar lista de conversas: ${err.message}` });
  }
});

// --- ORDENS DE SERVIÇO, ETAPAS E PROVAS ---
app.post(['/api/ordens-servico', '/api/chat/aceitar-proposta'], async (req, res) => {
  const { id_pedido, id_costureira, valor_total, previsao_entrega, valor_entrada } = req.body;

  if (!id_pedido || !id_costureira) {
    return res.status(400).json({ erro: 'Informações incompletas para gerar a Ordem de Serviço.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const queryOS = `
      INSERT INTO ordens_servico (id_pedido, id_costureira, valor_total, previsao_entrega, valor_entrada, status_kanban)
      VALUES ($1, $2, $3, $4, $5, 'Em Produção')
      ON CONFLICT (id_pedido) 
      DO UPDATE SET valor_total = $3, previsao_entrega = $4, valor_entrada = $5, status_kanban = 'Em Produção'
      RETURNING *;
    `;
    const osResult = await client.query(queryOS, [
      id_pedido, 
      id_costureira, 
      valor_total || 0, 
      previsao_entrega || null,
      valor_entrada || 0
    ]);

    await client.query(
      `UPDATE pedidos SET status_pedido = 'Em Produção' WHERE id_pedido = $1`,
      [id_pedido]
    );

    await client.query('COMMIT');

    res.status(201).json({
      mensagem: 'Proposta aceita! Ordem de Serviço iniciada com sucesso.',
      ordemServico: osResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao aceitar proposta:', err);
    res.status(500).json({ erro: 'Erro interno ao gerar Ordem de Serviço.' });
  } finally {
    client.release();
  }
});

// Agendamento de prova pela costureira (Passo 6)
app.post('/api/ordens-servico/:idOrdem/agendar-prova', async (req, res) => {
  const { idOrdem } = req.params;
  const { dataProva, observacao } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE ordens_servico SET status_kanban = 'Aguardando Prova', previsao_entrega = $1 WHERE id_ordem_servico = $2`,
      [dataProva, idOrdem]
    );

    const os = await client.query('SELECT id_pedido, id_costureira FROM ordens_servico WHERE id_ordem_servico = $1', [idOrdem]);
    
    if (os.rows.length > 0) {
      const idPedido = os.rows[0].id_pedido;
      const idCostureira = os.rows[0].id_costureira;

      await client.query(
        `UPDATE pedidos SET status_pedido = 'Aguardando Prova' WHERE id_pedido = $1`,
        [idPedido]
      );

      const textoMensagem = `📅 Prova da peça agendada!\nData da Prova: ${new Date(dataProva).toLocaleDateString('pt-BR')}\n${observacao ? `Observação: ${observacao}` : ''}`;

      await client.query(
        `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem) VALUES ($1, $2, $3, 'texto')`,
        [idPedido, idCostureira, textoMensagem]
      );
    }

    await client.query('COMMIT');
    res.json({ mensagem: 'Prova agendada e notificação enviada no chat com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao agendar prova:', err);
    res.status(500).json({ erro: 'Erro ao agendar prova.' });
  } finally {
    client.release();
  }
});

app.get('/api/ordens-servico/usuario/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const query = `
      SELECT 
        os.id_ordem_servico AS id, os.id_pedido AS "idPedido", os.valor_total AS "valorTotal", os.valor_entrada AS "valorEntrada", os.data_inicio AS "dataInicio",
        os.previsao_entrega AS "previsaoEntrega", os.status_kanban AS "statusKanban",
        p.descricao AS "pedidoDescricao",
        cli.nome AS "clienteNome", cli.telefone AS "clienteTelefone",
        cost.nome AS "costureiraNome", cost.telefone AS "costureiraTelefone"
      FROM ordens_servico os
      JOIN pedidos p ON os.id_pedido = p.id_pedido
      JOIN usuarios cli ON p.id_cliente = cli.id_usuario
      JOIN usuarios cost ON os.id_costureira = cost.id_usuario
      WHERE p.id_cliente = $1 OR os.id_costureira = $1
      ORDER BY os.previsao_entrega ASC;
    `;
    const result = await pool.query(query, [idUsuario]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar ordens de serviço:', err);
    res.status(500).json({ erro: 'Erro ao carregar ordens de serviço.' });
  }
});

app.put('/api/ordens-servico/:idOrdem/status', async (req, res) => {
  const { idOrdem } = req.params;
  const { status_kanban } = req.body;

  const statusValidos = ['A Fazer', 'Em Produção', 'Aguardando Prova', 'Concluído'];

  if (!status_kanban || !statusValidos.includes(status_kanban)) {
    return res.status(400).json({ erro: 'Status inválido fornecido.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const queryOS = `
      UPDATE ordens_servico 
      SET status_kanban = $1
      WHERE id_ordem_servico = $2
      RETURNING *;
    `;
    const resultOS = await client.query(queryOS, [status_kanban, idOrdem]);

    if (resultOS.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });
    }

    const ordemAtualizada = resultOS.rows[0];

    await client.query(
      `UPDATE pedidos SET status_pedido = $1 WHERE id_pedido = $2`,
      [status_kanban, ordemAtualizada.id_pedido]
    );

    await client.query('COMMIT');

    return res.json({
      mensagem: `Status atualizado para "${status_kanban}" com sucesso!`,
      ordem: ordemAtualizada
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar status kanban:', err);
    return res.status(500).json({ erro: 'Erro interno ao atualizar status no banco de dados.' });
  } finally {
    client.release();
  }
});

// CRON JOB para Lembretes
cron.schedule('0 8 * * *', async () => {
  console.log('Verificando ordens de serviço para lembrete diário...');
  try {
    const query = `
      SELECT 
        os.id_ordem_servico, os.status_kanban, os.previsao_entrega,
        cli.nome AS nome_cliente, cli.telefone AS fone_cliente,
        cost.nome AS nome_costureira, cost.telefone AS fone_costureira
      FROM ordens_servico os
      JOIN pedidos p ON os.id_pedido = p.id_pedido
      JOIN usuarios cli ON p.id_cliente = cli.id_usuario
      JOIN usuarios cost ON os.id_costureira = cost.id_usuario
      WHERE os.status_kanban IN ('Em Produção', 'Aguardando Prova')
        AND os.previsao_entrega = CURRENT_DATE + INTERVAL '1 day';
    `;
    const { rows } = await pool.query(query);

    for (const item of rows) {
      const tipoCompromisso = item.status_kanban === 'Aguardando Prova' ? 'Prova da Peça' : 'Entrega do Serviço';
      const msg = `Olá ${item.nome_cliente}! Lembrete do Ateliê Entre Linhas: Seu compromisso de ${tipoCompromisso} com a costureira ${item.nome_costureira} está previsto para amanhã.`;
      
      if (item.fone_cliente) {
        console.log(`[WhatsApp Lembrete] Para: ${item.fone_cliente} | Mensagem: "${msg}"`);
      }
    }
  } catch (err) {
    console.error('Erro na rotina de lembretes:', err);
  }
});

// --- AVALIAÇÕES ---
app.post('/api/avaliacoes', async (req, res) => {
  const { id_ordem_servico, id_cliente, nota, comentario } = req.body;

  if (!id_ordem_servico || !id_cliente || !nota) {
    return res.status(400).json({ erro: 'Ordem de serviço, cliente e nota são obrigatórios.' });
  }

  try {
    const osResult = await pool.query(
      'SELECT status_kanban FROM ordens_servico WHERE id_ordem_servico = $1 AND id_cliente = $2',
      [id_ordem_servico, id_cliente]
    );

    if (osResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Ordem de serviço não encontrada para este cliente.' });
    }

    const query = `
      INSERT INTO avaliacoes (id_ordem_servico, id_cliente, nota, comentario)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(query, [id_ordem_servico, id_cliente, nota, comentario || null]);
    res.status(201).json({ mensagem: 'Avaliação registrada com sucesso!', avaliacao: result.rows[0] });

  } catch (err) {
    console.error('Erro ao registrar avaliação:', err);
    res.status(500).json({ erro: 'Erro ao registrar avaliação no servidor.' });
  }
});

app.get('/api/avaliacoes/costureira/:idCostureira', async (req, res) => {
  const { idCostureira } = req.params;
  try {
    const queryAvaliacoes = `
      SELECT 
        a.id_avaliacao AS id, a.nota, a.comentario, a.data_avaliacao AS data,
        u.nome AS "clienteNome", u.foto_perfil AS "clienteFoto"
      FROM avaliacoes a
      JOIN ordens_servico os ON a.id_ordem_servico = os.id_ordem_servico
      JOIN usuarios u ON a.id_cliente = u.id_usuario
      WHERE os.id_costureira = $1
      ORDER BY a.data_avaliacao DESC;
    `;
    
    const queryMedia = `
      SELECT 
        ROUND(AVG(a.nota)::numeric, 1) AS media,
        COUNT(a.id_avaliacao) AS total
      FROM avaliacoes a
      JOIN ordens_servico os ON a.id_ordem_servico = os.id_ordem_servico
      WHERE os.id_costureira = $1;
    `;

    const avaliacoes = await pool.query(queryAvaliacoes, [idCostureira]);
    const estatisticas = await pool.query(queryMedia, [idCostureira]);

    res.json({
      media: parseFloat(estatisticas.rows[0].media) || 0,
      totalAvaliacoes: parseInt(estatisticas.rows[0].total) || 0,
      depoimentos: avaliacoes.rows
    });
  } catch (err) {
    console.error('Erro ao buscar avaliações:', err);
    res.status(500).json({ erro: 'Erro ao carregar avaliações da costureira.' });
  }
});

// --- PORTFÓLIO ---
app.get('/api/portfolio/:idCostureira', async (req, res) => {
  const { idCostureira } = req.params;
  try {
    const query = `
      SELECT 
        id_midia AS id,
        id_costureira AS "idCostureira",
        url_imagem AS "urlImagem",
        titulo_trabalho AS "tituloTrabalho",
        data_publicacao AS "dataPublicacao"
      FROM portfolio
      WHERE id_costureira = $1
      ORDER BY data_publicacao DESC;
    `;
    const result = await pool.query(query, [idCostureira]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar portfólio:', err);
    res.status(500).json({ erro: 'Erro ao carregar fotos do portfólio.' });
  }
});

app.post('/api/portfolio', async (req, res) => {
  const { id_costureira, url_imagem, titulo_trabalho } = req.body;

  if (!id_costureira || !url_imagem) {
    return res.status(400).json({ erro: 'Id da costureira e imagem são obrigatórios.' });
  }

  try {
    const query = `
      INSERT INTO portfolio (id_costureira, url_imagem, titulo_trabalho)
      VALUES ($1, $2, $3)
      RETURNING 
        id_midia AS id,
        id_costureira AS "idCostureira",
        url_imagem AS "urlImagem",
        titulo_trabalho AS "tituloTrabalho",
        data_publicacao AS "dataPublicacao";
    `;
    const result = await pool.query(query, [id_costureira, url_imagem, titulo_trabalho || null]);
    res.status(201).json({ mensagem: 'Trabalho adicionado com sucesso!', item: result.rows[0] });
  } catch (err) {
    console.error('Erro ao publicar no portfólio:', err);
    res.status(500).json({ erro: `Erro ao salvar imagem no portfólio: ${err.message}` });
  }
});

app.delete('/api/portfolio/:idMidia', async (req, res) => {
  const { idMidia } = req.params;
  try {
    const query = 'DELETE FROM portfolio WHERE id_midia = $1 RETURNING *;';
    const result = await pool.query(query, [idMidia]);
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Imagem não encontrada no portfólio.' });
    }
    res.json({ mensagem: 'Foto removida do portfólio!' });
  } catch (err) {
    console.error('Erro ao excluir foto do portfólio:', err);
    res.status(500).json({ erro: 'Erro ao remover imagem.' });
  }
});

// Endpoint para agendar a prova da peça (Costureira)
app.post('/api/ordens-servico/agendar-prova', async (req, res) => {
  const { id_pedido, dataProva, observacao, id_costureira } = req.body;

  if (!id_pedido || !dataProva) {
    return res.status(400).json({ erro: 'ID do pedido e data da prova são obrigatórios.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Atualiza ou cria a Ordem de Serviço mudando status para "Aguardando Prova"
    const queryOS = `
      INSERT INTO ordens_servico (id_pedido, id_costureira, valor_total, previsao_entrega, status_kanban)
      VALUES ($1, $2, 0, $3, 'Aguardando Prova')
      ON CONFLICT (id_pedido)
      DO UPDATE SET status_kanban = 'Aguardando Prova', previsao_entrega = $3;
    `;
    await client.query(queryOS, [id_pedido, id_costureira || null, dataProva]);

    // 2. Atualiza o pedido principal
    await client.query(
      `UPDATE pedidos SET status_pedido = 'Aguardando Prova' WHERE id_pedido = $1`,
      [id_pedido]
    );

    // 3. Insere mensagem automática de notificação no Chat
    const dataFormatada = new Date(dataProva + 'T12:00:00').toLocaleDateString('pt-BR');
    const textoMensagem = `PROVA AGENDADA!\nA prova da sua peça foi marcada para o dia ${dataFormatada}.\n${observacao ? `Observação da Costureira: ${observacao}` : ''}`;

    await client.query(
      `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem) VALUES ($1, $2, $3, 'texto')`,
      [id_pedido, id_costureira, textoMensagem]
    );

    await client.query('COMMIT');
    res.json({ mensagem: 'Prova agendada e notificação enviada no chat com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao agendar prova:', err);
    res.status(500).json({ erro: `Erro ao agendar prova: ${err.message}` });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});