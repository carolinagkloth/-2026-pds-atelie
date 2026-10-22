require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Configuração da conexão com o banco de dados Neon (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Configuração do Transportador de E-mail (Nodemailer)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- FUNÇÕES AUXILIARES DE E-MAIL ---

// Dispara aviso de novo login na conta
async function enviarEmailNotificacaoLogin(emailUsuario, nomeUsuario) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const mailOptions = {
    from: `"Ateliê Entre Linhas" <${process.env.EMAIL_USER}>`,
    to: emailUsuario,
    subject: 'Aviso de Segurança: Novo acesso à sua conta',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #3E2445;">Ateliê Entre Linhas</h2>
        <p>Olá, <strong>${nomeUsuario}</strong>!</p>
        <p>Identificamos um novo login na sua conta em <strong>${new Date().toLocaleString('pt-BR')}</strong>.</p>
        <p style="font-size: 13px; color: #666;">Se foi você, nenhuma ação é necessária. Caso não reconheça este acesso, recomendamos alterar sua senha imediatamente.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ E-mail de notificação de login enviado para: ${emailUsuario}`);
  } catch (err) {
    console.error('Erro ao enviar e-mail de notificação de login:', err.message);
  }
}

// Dispara e-mail com link único para redefinição de senha
async function enviarEmailRecuperacao(emailUsuario, nomeUsuario, token) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const linkRedefinicao = `http://localhost:5173/redefinir-senha?token=${token}`;

  const mailOptions = {
    from: `"Ateliê Entre Linhas" <${process.env.EMAIL_USER}>`,
    to: emailUsuario,
    subject: 'Redefinição de Senha - Ateliê Entre Linhas',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #3E2445;">Ateliê Entre Linhas</h2>
        <p>Olá, <strong>${nomeUsuario}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Clique no botão abaixo para cadastrar uma nova senha:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${linkRedefinicao}" style="background: #3E2445; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
            Redefinir Minha Senha
          </a>
        </div>
        <p style="font-size: 12px; color: #777;">Ou copie e cole o link a seguir no navegador:<br><a href="${linkRedefinicao}">${linkRedefinicao}</a></p>
        <p style="font-size: 13px; color: #666; margin-top: 20px;">Este link expira em 15 minutos. Se você não solicitou essa alteração, ignore este e-mail.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// --- ROTAS DE AUTENTICAÇÃO ---

// 1. Autenticação via Google OAuth 2.0
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ erro: 'Token de autenticação do Google não fornecido.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    let usuario = result.rows[0];

    if (!usuario) {
      const senhaDummy = await bcrypt.hash('GOOGLE_OAUTH_' + Math.random(), 10);
      const queryInsert = `
        INSERT INTO usuarios (nome, email, senha, tipo_usuario)
        VALUES ($1, $2, $3, $4)
        RETURNING id_usuario AS id, nome, email, tipo_usuario;
      `;
      const novoUsuario = await pool.query(queryInsert, [name, email, senhaDummy, 'Cliente']);
      usuario = novoUsuario.rows[0];
    }

    // Envia e-mail de notificação de login em segundo plano
    enviarEmailNotificacaoLogin(usuario.email, usuario.nome);

    return res.json({
      id: usuario.id_usuario || usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario
    });
  } catch (err) {
    console.error('Erro na autenticação do Google:', err);
    return res.status(401).json({ erro: 'Credencial do Google inválida ou expirada.' });
  }
});

// 2. Cadastro de Usuário (E-mail/Senha)
app.post('/api/cadastro', async (req, res) => {
  const { nome, email, senha, telefone, tipo_usuario, cpf_cnpj, endereco } = req.body;

  if (!nome || !email || !senha || !tipo_usuario) {
    return res.status(400).json({ erro: 'Por favor, preencha todos os campos obrigatórios.' });
  }

  try {
    const usuarioExiste = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (usuarioExiste.rows.length > 0) {
      return res.status(400).json({ erro: 'E-mail já cadastrado no sistema.' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const queryText = `
      INSERT INTO usuarios (nome, email, senha, telefone, tipo_usuario, cpf_cnpj, endereco)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_usuario AS id, nome, email, tipo_usuario;
    `;
    const values = [nome, email, senhaHash, telefone || null, tipo_usuario, cpf_cnpj || null, endereco || null];
    
    const novoUsuario = await pool.query(queryText, values);

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario: novoUsuario.rows[0]
    });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    return res.status(500).json({ erro: 'Erro interno no servidor ao realizar cadastro.' });
  }
});

// 3. Login de Usuário (E-mail/Senha)
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Preencha o e-mail e a senha.' });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const usuario = result.rows[0];

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    // Envia e-mail de notificação de login em segundo plano
    enviarEmailNotificacaoLogin(usuario.email, usuario.nome);

    return res.json({
      id: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ erro: 'Erro interno no servidor ao realizar login.' });
  }
});

// --- ROTAS DE RECUPERAÇÃO DE SENHA ---

// 4. Solicitar link de redefinição de senha
async function enviarEmailRecuperacao(emailUsuario, nomeUsuario, token) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Credenciais de e-mail (EMAIL_USER / EMAIL_PASS) não foram configuradas no arquivo .env!');
  }

  const linkRedefinicao = `http://localhost:5173/redefinir-senha?token=${token}`;

  const mailOptions = {
    from: `"Ateliê Entre Linhas" <${process.env.EMAIL_USER}>`,
    to: emailUsuario,
    subject: 'Redefinição de Senha - Ateliê Entre Linhas',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #3E2445;">Ateliê Entre Linhas</h2>
        <p>Olá, <strong>${nomeUsuario}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Clique no botão abaixo para cadastrar uma nova senha:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${linkRedefinicao}" style="background: #3E2445; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
            Redefinir Minha Senha
          </a>
        </div>
        <p style="font-size: 12px; color: #777;">Ou copie e cole o link a seguir no navegador:<br><a href="${linkRedefinicao}">${linkRedefinicao}</a></p>
        <p style="font-size: 13px; color: #666; margin-top: 20px;">Este link expira em 15 minutos. Se você não solicitou essa alteração, ignore este e-mail.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// ROTA AJUSTADA: Bloqueia e-mails não existentes no banco
app.post('/api/recuperar-senha', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ erro: 'Informe o seu e-mail.' });

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    // BLOQUEIO: Se o e-mail não existir na tabela usuarios, rejeita o pedido
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Este e-mail não está cadastrado no sistema.' });
    }

    const usuario = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiracao = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de validade

    await pool.query(
      'UPDATE usuarios SET token_recuperacao = $1, expiracao_token = $2 WHERE id_usuario = $3',
      [token, expiracao, usuario.id_usuario]
    );

    await enviarEmailRecuperacao(usuario.email, usuario.nome, token);

    return res.json({ mensagem: 'Enviamos um e-mail com o link para redefinir sua senha!' });
  } catch (err) {
    console.error('Erro na solicitação de recuperação:', err);
    return res.status(500).json({ erro: err.message || 'Erro ao enviar o e-mail de recuperação.' });
  }
});

// 5. Redefinir senha através do token recebido na URL
app.post('/api/redefinir-senha', async (req, res) => {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {
    return res.status(400).json({ erro: 'Token inválido ou nova senha não informada.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE token_recuperacao = $1 AND expiracao_token > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ erro: 'O link de redefinição é inválido ou já expirou.' });
    }

    const usuario = result.rows[0];
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    await pool.query(
      'UPDATE usuarios SET senha = $1, token_recuperacao = NULL, expiracao_token = NULL WHERE id_usuario = $2',
      [senhaHash, usuario.id_usuario]
    );

    return res.json({ mensagem: 'Senha alterada com sucesso! Você já pode fazer login.' });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    return res.status(500).json({ erro: 'Erro interno ao atualizar a senha.' });
  }
});

// --- ROTAS DE PEDIDOS ---

// 6. Listar todos os pedidos
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

// 7. Criar um novo pedido
app.post('/api/pedidos', async (req, res) => {
  const { id_cliente, descricao, fotos_referencia, prazo_desejado } = req.body;

  if (!id_cliente || !descricao || !prazo_desejado) {
    return res.status(400).json({ erro: 'Por favor, preencha os campos obrigatórios do pedido.' });
  }

  try {
    const queryText = `
      INSERT INTO pedidos (id_cliente, descricao, fotos_referencia, prazo_desejado)
      VALUES ($1, $2, $3, $4)
      RETURNING id_pedido AS id, descricao, fotos_referencia AS "fotoReferencia", prazo_desejado AS "prazoDesejado", status_pedido AS status;
    `;
    const values = [id_cliente, descricao, fotos_referencia || null, prazo_desejado];
    const result = await pool.query(queryText, values);

    return res.status(201).json({
      mensagem: 'Pedido publicado com sucesso!',
      pedido: result.rows[0]
    });
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    return res.status(500).json({ erro: 'Erro ao publicar pedido no servidor.' });
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});