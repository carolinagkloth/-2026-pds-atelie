require('dotenv').config();
const { enviarEmailNovoAcesso } = require('./emailService');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
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
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. Google OAuth 2.0
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
    const { email, name, picture } = payload;

    let result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    let usuario = result.rows[0];

    if (!usuario) {
      const senhaDummy = await bcrypt.hash('GOOGLE_OAUTH_' + Math.random(), 10);
      const queryInsert = `
        INSERT INTO usuarios (nome, email, senha, tipo_usuario, foto_perfil)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_usuario AS id, id_usuario, nome, email, tipo_usuario, foto_perfil;
      `;
      const novoUsuario = await pool.query(queryInsert, [name, email, senhaDummy, 'Cliente', picture || null]);
      usuario = novoUsuario.rows[0];
    } else if (picture && !usuario.foto_perfil) {
      await pool.query('UPDATE usuarios SET foto_perfil = $1 WHERE id_usuario = $2', [picture, usuario.id_usuario]);
      usuario.foto_perfil = picture;
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
        foto_perfil: usuario.foto_perfil || picture || null
      }
    });
  } catch (err) {
    console.error('Erro na autenticação do Google:', err);
    return res.status(401).json({ erro: 'Credencial do Google inválida ou expirada.' });
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
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Credenciais de e-mail não configuradas no arquivo .env!');
  }

  const linkRedefinicao = `http://localhost:5173/?tela=redefinirSenha&token=${token}`;

  const mailOptions = {
    from: `"Ateliê Entre Linhas" <${process.env.EMAIL_USER}>`,
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
              Este link é válido por 15 minutos. Se você não solicitou esta alteração, desconsidere este e-mail.
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

// --- PERFIL E PEDIDOS ---
app.get('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id_usuario AS id, nome, email, telefone, tipo_usuario, cpf_cnpj, endereco, bio, foto_perfil FROM usuarios WHERE id_usuario = $1',
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

app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, endereco, bio, foto_perfil } = req.body;
  try {
    const query = `
      UPDATE usuarios 
      SET nome = $1, telefone = $2, endereco = $3, bio = $4, foto_perfil = $5
      WHERE id_usuario = $6
      RETURNING id_usuario AS id, id_usuario, nome, email, tipo_usuario, telefone, endereco, bio, foto_perfil;
    `;
    const result = await pool.query(query, [nome, telefone || null, endereco || null, bio || null, foto_perfil || null, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.json({ mensagem: 'Perfil atualizado com sucesso!', usuario: result.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ erro: 'Erro ao atualizar perfil no banco de dados.' });
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

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});