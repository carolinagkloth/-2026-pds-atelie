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
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

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

// Configuração do Nodemailer
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

// --- INICIALIZAÇÃO DO WHATSAPP (whatsapp-web.js) ---
const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

whatsappClient.on('qr', (qr) => {
  console.log('\n==================================================');
  console.log('📲 ESCANEE O QR CODE ABAIXO PARA CONECTAR O WHATSAPP:');
  console.log('==================================================\n');
  qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
  console.log('✅ WhatsApp do Ateliê conectado com sucesso e pronto para envio!');
});

whatsappClient.on('disconnected', (reason) => {
  console.log('⚠️ WhatsApp desconectado:', reason);
  whatsappClient.initialize().catch((err) => console.error('Erro ao reativar WhatsApp:', err));
});

whatsappClient.on('auth_failure', (msg) => {
  console.error('❌ Falha na autenticação do WhatsApp:', msg);
});

// Inicializa sem derrubar o servidor Node em caso de erro no Puppeteer
whatsappClient.initialize().catch((err) => {
  console.error('⚠️ Aviso: Falha na inicialização do WhatsApp Web:', err.message);
});

async function enviarMensagemWhatsapp(telefone, texto) {
  try {
    if (!telefone || !whatsappClient) return;

    // 1. Deixa apenas números
    let limpo = telefone.replace(/\D/g, '');

    // 2. Se tiver DDD + número (10 ou 11 dígitos), insere o código do Brasil (55)
    if (limpo.length === 10 || limpo.length === 11) {
      limpo = '55' + limpo;
    }

    // 3. Consulta o WhatsApp para obter o ID/LID real registrado nos servidores
    const numberDetails = await whatsappClient.getNumberId(limpo);

    if (!numberDetails) {
      console.error(`[WhatsApp Erro] O número ${telefone} (${limpo}) não tem conta ativa no WhatsApp.`);
      return;
    }

    // 4. Envia a mensagem utilizando o ID/LID oficial retornado (_serialized)
    await whatsappClient.sendMessage(numberDetails._serialized, texto);
    console.log(`[WhatsApp] Mensagem enviada com sucesso para ${telefone}!`);
  } catch (err) {
    console.error(`[WhatsApp Erro] Falha ao enviar para ${telefone}:`, err.message);
  }
}

// --- FUNÇÃO CENTRAL DE NOTIFICAÇÕES (SITE, E-MAIL E WHATSAPP) ---
async function dispararNotificacao({ idUsuario, titulo, mensagem, tipo, idPedido = null, forcarWhatsapp = false }) {
  try {
    // 1. Notificação no site (Sininho)
    await pool.query(
      `INSERT INTO notificacoes (id_usuario, titulo, mensagem, tipo, id_pedido)
       VALUES ($1, $2, $3, $4, $5)`,
      [idUsuario, titulo, mensagem, tipo, idPedido]
    );

    // 2. Busca usuário e preferências
    const userRes = await pool.query('SELECT email, nome, telefone FROM usuarios WHERE id_usuario = $1', [idUsuario]);
    if (userRes.rows.length === 0) return;
    const usuario = userRes.rows[0];

    let prefRes = await pool.query('SELECT * FROM configuracoes_notificacoes WHERE id_usuario = $1', [idUsuario]);
    let prefs = prefRes.rows[0];
    if (!prefs) {
      const ins = await pool.query('INSERT INTO configuracoes_notificacoes (id_usuario) VALUES ($1) RETURNING *', [idUsuario]);
      prefs = ins.rows[0];
    }

    const mapaEmail = {
      proposta: prefs.notif_proposta,
      chat: prefs.notif_chat,
      prova: prefs.notif_prova,
      status: prefs.notif_status,
      lembrete: prefs.notif_lembrete,
      avaliacao: prefs.notif_avaliacao,
      cancelamento: prefs.notif_cancelamento
    };

    // 3. Envio de E-mail
    if (mapaEmail[tipo] !== false && usuario.email) {
      transporter.sendMail({
        from: `"Ateliê Entre Linhas" <${EMAIL_OFICIAL}>`,
        to: usuario.email,
        subject: `Ateliê - ${titulo}`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                 <h2 style="color: #3E2445;">Olá, ${usuario.nome}!</h2>
                 <p style="font-size: 14px; color: #333;">${mensagem}</p>
                 <br/><small style="color: #888;">Ateliê Entre Linhas</small>
               </div>`
      }).catch((err) => console.error('Erro ao enviar e-mail:', err));
    }

    // 4. Envio de WhatsApp (se for evento crítico + permissão)
    if (forcarWhatsapp && prefs.receber_whatsapp !== false && usuario.telefone) {
      const textoZap = `🧵 *Ateliê Entre Linhas*\nOlá, ${usuario.nome}!\n\n📌 *${titulo}*\n${mensagem}`;
      await enviarMensagemWhatsapp(usuario.telefone, textoZap);
    }
  } catch (err) {
    console.error('Erro ao disparar notificação:', err);
  }
}

// 1. Google OAuth 2.0
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ erro: 'Token não fornecido.' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    let usuario = result.rows[0];

    if (!usuario) {
      return res.json({
        novoUsuario: true,
        dadosGoogle: { nome: name, email: email, foto_perfil: picture || null }
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
        foto_perfil: usuario.foto_perfil || picture || null,
        telefone: usuario.telefone || null
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

    if (!nome || !email || !senha || !telefone) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios (nome, e-mail, senha e telefone).' });
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
       RETURNING id_usuario AS id, id_usuario, nome, email, tipo_usuario, telefone`,
      [nome, email.trim(), senhaHash, telefone.trim(), cpf_cnpj || null, perfil]
    );

    const novoUser = result.rows[0];
    await pool.query('INSERT INTO configuracoes_notificacoes (id_usuario) VALUES ($1) ON CONFLICT DO NOTHING', [novoUser.id_usuario]);

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario: novoUser
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

    if (!email || !senha) return res.status(400).json({ erro: 'Preencha o e-mail e a senha.' });

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.trim()]);
    if (result.rows.length === 0) return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });

    const usuario = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });

    enviarEmailNovoAcesso(usuario.email, usuario.nome, pool);

    return res.json({
      mensagem: 'Login realizado com sucesso!',
      usuario: { 
        id: usuario.id_usuario || usuario.id, 
        id_usuario: usuario.id_usuario || usuario.id, 
        nome: usuario.nome, 
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario || 'Cliente',
        foto_perfil: usuario.foto_perfil || null,
        telefone: usuario.telefone || null
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// 4. Recuperação e Redefinição de Senha
async function enviarEmailRecuperacao(emailUsuario, nomeUsuario, token) {
  if (!process.env.EMAIL_PASS) throw new Error('Senha de e-mail não configurada no .env!');

  const linkRedefinicao = `http://localhost:5173/?tela=redefinirSenha&token=${token}`;

  await transporter.sendMail({
    from: `"Ateliê Entre Linhas" <${EMAIL_OFICIAL}>`,
    replyTo: EMAIL_OFICIAL,
    to: emailUsuario,
    subject: 'Redefinição de Senha - Ateliê Entre Linhas',
    html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
             <h2>Olá, ${nomeUsuario}!</h2>
             <p>Clique no link para redefinir sua senha:</p>
             <a href="${linkRedefinicao}">${linkRedefinicao}</a>
           </div>`
  });
}

app.post('/api/recuperar-senha', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ erro: 'Informe o seu e-mail.' });

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.trim()]);
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Este e-mail não está cadastrado.' });

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
    return res.status(500).json({ erro: err.message || 'Erro ao enviar e-mail de recuperação.' });
  }
});

app.post('/api/redefinir-senha', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    if (!token) return res.status(400).json({ erro: 'Token ausente.' });
    if (!novaSenha || novaSenha.length < 8) return res.status(400).json({ erro: 'Senha deve ter no mínimo 8 caracteres.' });

    const result = await pool.query('SELECT * FROM usuarios WHERE token_redefinicao = $1', [token.trim()]);
    if (result.rows.length === 0) return res.status(400).json({ erro: 'Link inválido ou expirado.' });

    const usuario = result.rows[0];
    if (new Date() > new Date(usuario.token_expiracao)) {
      return res.status(400).json({ erro: 'Link expirado.' });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await pool.query(
      'UPDATE usuarios SET senha = $1, token_redefinicao = NULL, token_expiracao = NULL WHERE id_usuario = $2',
      [senhaHash, usuario.id_usuario]
    );

    return res.json({ mensagem: 'Senha redefinida com sucesso!' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao redefinir senha.' });
  }
});

// --- PERFIL E MEDIDAS ---
app.get('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id_usuario AS id, id_usuario, nome, email, telefone, tipo_usuario, cpf_cnpj, endereco, bio, especialidades, foto_perfil FROM usuarios WHERE id_usuario = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao carregar dados do perfil.' });
  }
});

app.get('/api/usuarios/:id/medidas', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT busto, cintura, quadril, altura, comprimento, observacoes_medidas FROM usuarios WHERE id_usuario = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar medidas.' });
  }
});

app.put('/api/usuarios/:id/medidas', async (req, res) => {
  const { id } = req.params;
  const { busto, cintura, quadril, altura, comprimento, observacoes_medidas } = req.body;
  try {
    await pool.query(
      `UPDATE usuarios SET busto = $1, cintura = $2, quadril = $3, altura = $4, comprimento = $5, observacoes_medidas = $6 WHERE id_usuario = $7`,
      [busto || null, cintura || null, quadril || null, altura || null, comprimento || null, observacoes_medidas || null, id]
    );
    res.json({ mensagem: 'Medidas salvas!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar medidas.' });
  }
});

// --- NOTIFICAÇÕES E CONFIGURAÇÕES ---
app.get('/api/notificacoes/usuario/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const result = await pool.query('SELECT * FROM notificacoes WHERE id_usuario = $1 ORDER BY data_criacao DESC LIMIT 30', [idUsuario]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar notificações.' });
  }
});

app.put('/api/notificacoes/:idNotificacao/lida', async (req, res) => {
  const { idNotificacao } = req.params;
  try {
    await pool.query('UPDATE notificacoes SET lida = TRUE WHERE id_notificacao = $1', [idNotificacao]);
    res.json({ mensagem: 'Notificação lida.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar notificação.' });
  }
});

app.put('/api/notificacoes/usuario/:idUsuario/marcar-todas-lidas', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    await pool.query('UPDATE notificacoes SET lida = TRUE WHERE id_usuario = $1', [idUsuario]);
    res.json({ mensagem: 'Todas marcadas como lidas.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar notificações.' });
  }
});

app.get('/api/usuarios/:id/configuracoes-notificacoes', async (req, res) => {
  const { id } = req.params;
  try {
    let result = await pool.query('SELECT * FROM configuracoes_notificacoes WHERE id_usuario = $1', [id]);
    if (result.rows.length === 0) {
      result = await pool.query('INSERT INTO configuracoes_notificacoes (id_usuario) VALUES ($1) RETURNING *', [id]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar preferências.' });
  }
});

app.put('/api/usuarios/:id/configuracoes-notificacoes', async (req, res) => {
  const { id } = req.params;
  const { receber_whatsapp, notif_proposta, notif_chat, notif_prova, notif_status, notif_lembrete, notif_avaliacao, notif_cancelamento } = req.body;

  try {
    await pool.query(
      `UPDATE configuracoes_notificacoes 
       SET receber_whatsapp = $1, notif_proposta = $2, notif_chat = $3, notif_prova = $4, 
           notif_status = $5, notif_lembrete = $6, notif_avaliacao = $7, notif_cancelamento = $8
       WHERE id_usuario = $9`,
      [receber_whatsapp, notif_proposta, notif_chat, notif_prova, notif_status, notif_lembrete, notif_avaliacao, notif_cancelamento, id]
    );
    res.json({ mensagem: 'Preferências salvas!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar preferências.' });
  }
});

// --- PEDIDOS ---
app.get('/api/pedidos', async (req, res) => {
  try {
    const queryText = `
      SELECT p.id_pedido AS id, p.descricao, p.fotos_referencia AS "fotoReferencia", p.data_publicacao AS "dataPublicacao",
             p.prazo_desejado AS "prazoDesejado", p.status_pedido AS status, u.nome AS "clienteNome", u.id_usuario AS "clienteId",
             COALESCE(u.endereco, 'Não informado') AS localizacao
      FROM pedidos p JOIN usuarios u ON p.id_cliente = u.id_usuario
      ORDER BY p.data_publicacao DESC;
    `;
    const result = await pool.query(queryText);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pedidos.' });
  }
});

app.post('/api/pedidos', async (req, res) => {
  const { id_cliente, descricao, fotos_referencia, prazo_desejado } = req.body;
  if (!id_cliente || !descricao || !prazo_desejado) return res.status(400).json({ erro: 'Campos obrigatórios em falta.' });

  try {
    const result = await pool.query(
      `INSERT INTO pedidos (id_cliente, descricao, fotos_referencia, prazo_desejado, status_pedido) VALUES ($1, $2, $3, $4, 'Aberto') RETURNING *;`,
      [id_cliente, descricao, fotos_referencia || null, prazo_desejado]
    );
    res.status(201).json({ mensagem: 'Pedido criado com sucesso!', pedido: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar pedido.' });
  }
});

app.put('/api/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  const { id_cliente, descricao, fotos_referencia, prazo_desejado } = req.body;

  if (!descricao || !descricao.trim()) return res.status(400).json({ erro: 'A descrição do pedido é obrigatória.' });

  try {
    const checagem = await pool.query('SELECT status_pedido FROM pedidos WHERE id_pedido = $1', [id]);
    if (checagem.rows.length === 0) return res.status(404).json({ erro: 'Pedido não encontrado.' });

    if (checagem.rows[0].status_pedido !== 'Aberto') {
      return res.status(400).json({ erro: 'Não é possível editar um pedido que já teve proposta aceita ou está em produção.' });
    }

    const queryUpdate = `
      UPDATE pedidos SET descricao = $1, fotos_referencia = $2, prazo_desejado = $3
      WHERE id_pedido = $4 AND id_cliente = $5 RETURNING *;
    `;
    const result = await pool.query(queryUpdate, [descricao.trim(), fotos_referencia || null, prazo_desejado, id, id_cliente]);
    res.json({ mensagem: 'Pedido atualizado com sucesso!', pedido: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao atualizar pedido.' });
  }
});

app.delete('/api/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pedRes = await pool.query('SELECT * FROM pedidos WHERE id_pedido = $1', [id]);
    if (pedRes.rows.length === 0) return res.status(404).json({ erro: 'Pedido não encontrado.' });

    const osRes = await pool.query('SELECT id_costureira FROM ordens_servico WHERE id_pedido = $1', [id]);
    await pool.query('DELETE FROM pedidos WHERE id_pedido = $1', [id]);

    if (osRes.rows.length > 0) {
      await dispararNotificacao({
        idUsuario: osRes.rows[0].id_costureira,
        titulo: 'Pedido Cancelado',
        mensagem: `O pedido #${id} foi cancelado pelo cliente.`,
        tipo: 'cancelamento',
        forcarWhatsapp: false
      });
    }

    res.json({ mensagem: 'Pedido cancelado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cancelar pedido.' });
  }
});

// --- CHAT E NEGOCIAÇÃO ---
app.get(['/api/mensagens-chat/:idPedido', '/api/chat/:idPedido'], async (req, res) => {
  const { idPedido } = req.params;
  try {
    const query = `
      SELECT m.id_mensagem AS id, m.id_mensagem, m.id_pedido AS "idPedido", m.id_pedido, m.id_remetente AS "idRemetente",
             m.id_remetente, u.nome AS "remetente_nome", u.nome AS "nomeRemetente", u.foto_perfil AS "fotoRemetente",
             m.conteudo, m.tipo_mensagem, m.dados_proposta, m.valor_proposta AS "valorProposta",
             m.prazo_proposta AS "prazoProposta", m.valor_entrada AS "valorEntrada", m.data_hora_envio AS "dataHoraEnvio"
      FROM mensagens_chat m JOIN usuarios u ON m.id_remetente = u.id_usuario
      WHERE m.id_pedido = $1 ORDER BY m.data_hora_envio ASC;
    `;
    const result = await pool.query(query, [idPedido]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar mensagens.' });
  }
});

app.post(['/api/mensagens-chat', '/api/chat'], async (req, res) => {
  const { id_pedido, id_remetente, conteudo, tipo_mensagem, dados_proposta, valor_proposta, prazo_proposta, valor_entrada } = req.body;
  if (!id_pedido || !id_remetente || !conteudo) return res.status(400).json({ erro: 'Pedido, remetente e conteúdo são obrigatórios.' });

  try {
    const query = `
      INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem, dados_proposta, valor_proposta, prazo_proposta, valor_entrada)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
    `;
    const dadosJson = dados_proposta ? (typeof dados_proposta === 'string' ? dados_proposta : JSON.stringify(dados_proposta)) : null;

    const result = await pool.query(query, [
      id_pedido, id_remetente, conteudo, tipo_mensagem || 'texto',
      dadosJson, valor_proposta || null, prazo_proposta || null, valor_entrada || 0
    ]);

    const pedRes = await pool.query('SELECT id_cliente FROM pedidos WHERE id_pedido = $1', [id_pedido]);
    const osRes = await pool.query('SELECT id_costureira FROM ordens_servico WHERE id_pedido = $1', [id_pedido]);

    const idCliente = pedRes.rows[0]?.id_cliente;
    const idCostureira = osRes.rows[0]?.id_costureira;
    const idDestinatario = Number(id_remetente) === Number(idCliente) ? idCostureira : idCliente;

    if (idDestinatario) {
      const tipoNotif = tipo_mensagem === 'proposta' ? 'proposta' : 'chat';
      const tituloNotif = tipo_mensagem === 'proposta' ? 'Nova Proposta Recebida' : 'Nova Mensagem no Chat';

      await dispararNotificacao({
        idUsuario: idDestinatario,
        titulo: tituloNotif,
        mensagem: conteudo,
        tipo: tipoNotif,
        idPedido: id_pedido,
        forcarWhatsapp: false
      });
    }

    res.status(201).json({ mensagem: 'Mensagem enviada com sucesso!', item: result.rows[0], ...result.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.get('/api/conversas/usuario/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const query = `
      SELECT p.id_pedido AS "idPedido", p.id_pedido AS id, p.descricao, p.status_pedido AS status, p.prazo_desejado AS "prazoDesejado",
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
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// --- ORDENS DE SERVIÇO ---
app.post(['/api/ordens-servico', '/api/chat/aceitar-proposta'], async (req, res) => {
  const { id_pedido, id_costureira, valor_total, previsao_entrega, valor_entrada } = req.body;
  if (!id_pedido || !id_costureira) return res.status(400).json({ erro: 'Informações incompletas para gerar Ordem de Serviço.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const queryOS = `
      INSERT INTO ordens_servico (id_pedido, id_costureira, valor_total, previsao_entrega, valor_entrada, status_kanban)
      VALUES ($1, $2, $3, $4, $5, 'Em Produção')
      ON CONFLICT (id_pedido) DO UPDATE SET valor_total = $3, previsao_entrega = $4, valor_entrada = $5, status_kanban = 'Em Produção'
      RETURNING *;
    `;
    const osResult = await client.query(queryOS, [id_pedido, id_costureira, valor_total || 0, previsao_entrega || null, valor_entrada || 0]);
    await client.query(`UPDATE pedidos SET status_pedido = 'Em Produção' WHERE id_pedido = $1`, [id_pedido]);

    await client.query('COMMIT');

    await dispararNotificacao({
      idUsuario: id_costureira,
      titulo: 'Proposta Aceita! 🎉',
      mensagem: `A cliente aprovou sua proposta para o Pedido #${id_pedido}. O serviço está marked como Em Produção!`,
      tipo: 'status',
      idPedido: id_pedido,
      forcarWhatsapp: true
    });

    res.status(201).json({ mensagem: 'Proposta aceita com sucesso!', ordemServico: osResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: 'Erro interno ao gerar Ordem de Serviço.' });
  } finally {
    client.release();
  }
});

app.post('/api/ordens-servico/agendar-prova', async (req, res) => {
  const { id_pedido, dataProva, observacao, id_costureira } = req.body;
  if (!id_pedido || !dataProva) return res.status(400).json({ erro: 'ID e data são obrigatórios.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO ordens_servico (id_pedido, id_costureira, valor_total, previsao_entrega, status_kanban)
       VALUES ($1, $2, 0, $3, 'Aguardando Prova')
       ON CONFLICT (id_pedido) DO UPDATE SET status_kanban = 'Aguardando Prova', previsao_entrega = $3;`,
      [id_pedido, id_costureira || null, dataProva]
    );

    await client.query(`UPDATE pedidos SET status_pedido = 'Aguardando Prova' WHERE id_pedido = $1`, [id_pedido]);

    const pedRes = await client.query('SELECT id_cliente FROM pedidos WHERE id_pedido = $1', [id_pedido]);
    const idCliente = pedRes.rows[0]?.id_cliente;

    const dataFormatada = new Date(dataProva + 'T12:00:00').toLocaleDateString('pt-BR');
    const msgTexto = `Sua prova da peça foi agendada para o dia ${dataFormatada}.${observacao ? ` Obs: ${observacao}` : ''}`;

    await client.query(
      `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem) VALUES ($1, $2, $3, 'texto')`,
      [id_pedido, id_costureira, `📅 PROVA AGENDADA!\n${msgTexto}`]
    );

    await client.query('COMMIT');

    if (idCliente) {
      await dispararNotificacao({
        idUsuario: idCliente,
        titulo: 'Prova Agendada! 🗓️',
        mensagem: msgTexto,
        tipo: 'prova',
        idPedido: id_pedido,
        forcarWhatsapp: true
      });
    }

    res.json({ mensagem: 'Prova agendada e cliente notificado!' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/ordens-servico/usuario/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const query = `
      SELECT os.id_ordem_servico AS id, os.id_pedido AS "idPedido", os.valor_total AS "valorTotal", os.valor_entrada AS "valorEntrada",
             os.data_inicio AS "dataInicio", os.previsao_entrega AS "previsaoEntrega", os.status_kanban AS "statusKanban",
             p.descricao AS "pedidoDescricao", cli.nome AS "clienteNome", cli.telefone AS "clienteTelefone",
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

    const osRes = await client.query(`UPDATE ordens_servico SET status_kanban = $1 WHERE id_ordem_servico = $2 RETURNING *;`, [status_kanban, idOrdem]);
    if (osRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });
    }

    const ordem = osRes.rows[0];
    await client.query(`UPDATE pedidos SET status_pedido = $1 WHERE id_pedido = $2`, [status_kanban, ordem.id_pedido]);

    await client.query('COMMIT');

    const pedRes = await pool.query('SELECT id_cliente FROM pedidos WHERE id_pedido = $1', [ordem.id_pedido]);
    const idCliente = pedRes.rows[0]?.id_cliente;

    if (status_kanban === 'Concluído' && idCliente) {
      await dispararNotificacao({
        idUsuario: idCliente,
        titulo: 'Seu Pedido está Pronto! ⭐',
        mensagem: `Sua peça do Pedido #${ordem.id_pedido} foi concluída. Confirme a entrega e deixe sua avaliação!`,
        tipo: 'avaliacao',
        idPedido: ordem.id_pedido,
        forcarWhatsapp: true
      });
    }

    res.json({ mensagem: `Status atualizado para "${status_kanban}" com sucesso!`, ordem });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: 'Erro ao atualizar status.' });
  } finally {
    client.release();
  }
});

// --- AVALIAÇÕES ---
app.post('/api/avaliacoes', async (req, res) => {
  const { id_ordem_servico, id_cliente, nota, comentario } = req.body;
  if (!id_ordem_servico || !id_cliente || !nota) return res.status(400).json({ erro: 'Campos obrigatórios ausentes.' });

  try {
    const osResult = await pool.query('SELECT status_kanban, id_costureira FROM ordens_servico WHERE id_ordem_servico = $1', [id_ordem_servico]);
    if (osResult.rows.length === 0) return res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });

    const result = await pool.query(
      `INSERT INTO avaliacoes (id_ordem_servico, id_cliente, nota, comentario) VALUES ($1, $2, $3, $4) RETURNING *;`,
      [id_ordem_servico, id_cliente, nota, comentario || null]
    );

    // Notifica a costureira sobre a nova avaliação recebida
    if (osResult.rows[0].id_costureira) {
      await dispararNotificacao({
        idUsuario: osResult.rows[0].id_costureira,
        titulo: 'Nova Avaliação Recebida! ⭐',
        mensagem: `O cliente deixou uma nota ${nota}/5 e um comentário sobre o seu serviço.`,
        tipo: 'avaliacao',
        forcarWhatsapp: false
      });
    }

    res.status(201).json({ mensagem: 'Avaliação registrada com sucesso!', avaliacao: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar avaliação.' });
  }
});

app.get('/api/avaliacoes/costureira/:idCostureira', async (req, res) => {
  const { idCostureira } = req.params;
  try {
    const queryAvaliacoes = `
      SELECT a.id_avaliacao AS id, a.nota, a.comentario, a.data_avaliacao AS data,
             u.nome AS "clienteNome", u.foto_perfil AS "clienteFoto"
      FROM avaliacoes a
      JOIN ordens_servico os ON a.id_ordem_servico = os.id_ordem_servico
      JOIN usuarios u ON a.id_cliente = u.id_usuario
      WHERE os.id_costureira = $1
      ORDER BY a.data_avaliacao DESC;
    `;
    const queryMedia = `
      SELECT ROUND(AVG(a.nota)::numeric, 1) AS media, COUNT(a.id_avaliacao) AS total
      FROM avaliacoes a JOIN ordens_servico os ON a.id_ordem_servico = os.id_ordem_servico
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
    res.status(500).json({ erro: 'Erro ao carregar avaliações.' });
  }
});

// --- PORTFÓLIO ---
app.get('/api/portfolio/:idCostureira', async (req, res) => {
  const { idCostureira } = req.params;
  try {
    const query = `
      SELECT id_midia AS id, id_costureira AS "idCostureira", url_imagem AS "urlImagem",
             titulo_trabalho AS "tituloTrabalho", data_publicacao AS "dataPublicacao"
      FROM portfolio WHERE id_costureira = $1 ORDER BY data_publicacao DESC;
    `;
    const result = await pool.query(query, [idCostureira]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar fotos do portfólio.' });
  }
});

app.post('/api/portfolio', async (req, res) => {
  const { id_costureira, url_imagem, titulo_trabalho } = req.body;
  if (!id_costureira || !url_imagem) return res.status(400).json({ erro: 'ID da costureira e imagem são obrigatórios.' });

  try {
    const query = `
      INSERT INTO portfolio (id_costureira, url_imagem, titulo_trabalho)
      VALUES ($1, $2, $3)
      RETURNING id_midia AS id, id_costureira AS "idCostureira", url_imagem AS "urlImagem",
                titulo_trabalho AS "tituloTrabalho", data_publicacao AS "dataPublicacao";
    `;
    const result = await pool.query(query, [id_costureira, url_imagem, titulo_trabalho || null]);
    res.status(201).json({ mensagem: 'Trabalho adicionado com sucesso!', item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.delete('/api/portfolio/:idMidia', async (req, res) => {
  const { idMidia } = req.params;
  try {
    const result = await pool.query('DELETE FROM portfolio WHERE id_midia = $1 RETURNING *;', [idMidia]);
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Imagem não encontrada.' });
    res.json({ mensagem: 'Foto removida do portfólio!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover imagem.' });
  }
});

// --- CRON JOB: Lembretes diários às 08:00 ---
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Executando verificação diária de lembretes...');
  try {
    const query = `
      SELECT os.id_ordem_servico, os.id_pedido, os.status_kanban, os.previsao_entrega,
             cli.id_usuario AS id_cliente, cost.id_usuario AS id_costureira
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

      // Notificação para o Cliente
      await dispararNotificacao({
        idUsuario: item.id_cliente,
        titulo: 'Lembrete do Ateliê ⏰',
        mensagem: `Aviso de Véspera: Seu compromisso de ${tipoCompromisso} referente ao Pedido #${item.id_pedido} é AMANHÃ!`,
        tipo: 'lembrete',
        idPedido: item.id_pedido,
        forcarWhatsapp: true
      });

      // Notificação para a Costureira
      await dispararNotificacao({
        idUsuario: item.id_costureira,
        titulo: 'Lembrete de Agenda AMANHÃ 🗓️',
        mensagem: `Você possui um compromisso de ${tipoCompromisso} agendado para amanhã referente ao Pedido #${item.id_pedido}.`,
        tipo: 'lembrete',
        idPedido: item.id_pedido,
        forcarWhatsapp: true
      });
    }
  } catch (err) {
    console.error('Erro na rotina de lembretes:', err);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});