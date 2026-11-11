const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/database');
const { OAuth2Client } = require('google-auth-library');
const usuarioModel = require('../models/usuarioModel');
const { enviarEmailNovoAcesso, enviarEmailRecuperacao } = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class UsuarioController {
  // --- AUTENTICAÇÃO E CONTA ---
  static async cadastrar(req, res) {
    const { nome, email, senha, telefone, tipo_usuario, endereco } = req.body;

    if (!email || !senha || !nome) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    try {
      const queryVerificacao = `
        SELECT email, telefone FROM usuarios 
        WHERE LOWER(email) = LOWER($1) 
           OR ($2::text IS NOT NULL AND $2::text <> '' AND telefone = $2::text);
      `;
      const resultVerificacao = await pool.query(queryVerificacao, [
        email.trim(), 
        telefone ? telefone.trim() : null
      ]);

      if (resultVerificacao.rows.length > 0) {
        const usuarioExistente = resultVerificacao.rows[0];
        if (usuarioExistente.email.toLowerCase() === email.trim().toLowerCase()) {
          return res.status(400).json({ erro: 'Este e-mail já está cadastrado em outra conta.' });
        }
        if (telefone && usuarioExistente.telefone === telefone.trim()) {
          return res.status(400).json({ erro: 'Este número de telefone/WhatsApp já está cadastrado em outra conta.' });
        }
      }

      const queryInsert = `
        INSERT INTO usuarios (nome, email, senha, telefone, tipo_usuario, endereco)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id_usuario, nome, email, telefone, tipo_usuario, endereco;
      `;

      const novoUsuario = await pool.query(queryInsert, [
        nome.trim(),
        email.trim().toLowerCase(),
        senha,
        telefone ? telefone.trim() : null,
        tipo_usuario || 'Cliente',
        endereco || ''
      ]);

      return res.status(201).json({
        mensagem: 'Usuário cadastrado com sucesso!',
        usuario: novoUsuario.rows[0]
      });

    } catch (err) {
      console.error('Erro ao cadastrar usuário:', err);
      return res.status(500).json({ erro: 'Erro interno do servidor ao cadastrar usuário.' });
    }
  }

  static async login(req, res) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) return res.status(400).json({ erro: 'Preencha o e-mail e a senha.' });

      const usuario = await usuarioModel.buscarPorEmail(email);
      if (!usuario) return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });

      enviarEmailNovoAcesso(usuario.email, usuario.nome);

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
  }

  static async googleAuth(req, res) {
    const { token } = req.body;
    if (!token) return res.status(400).json({ erro: 'Token não fornecido.' });

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      const { email, name, picture } = payload;

      const usuario = await usuarioModel.buscarPorEmail(email);

      if (!usuario) {
        return res.json({
          novoUsuario: true,
          dadosGoogle: { nome: name, email: email, foto_perfil: picture || null }
        });
      }

      enviarEmailNovoAcesso(usuario.email, usuario.nome);

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
  }

  static async recuperarSenha(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ erro: 'Informe o seu e-mail.' });

    try {
      const usuario = await usuarioModel.buscarPorEmail(email);
      if (!usuario) return res.status(404).json({ erro: 'Este e-mail não está cadastrado.' });

      const token = crypto.randomBytes(32).toString('hex');
      const expiracao = new Date(Date.now() + 15 * 60 * 1000);

      await usuarioModel.salvarTokenRedefinicao(usuario.id_usuario, token, expiracao);
      await enviarEmailRecuperacao(usuario.email, usuario.nome, token);

      return res.json({ mensagem: 'Enviamos um e-mail com o link para redefinir sua senha!' });
    } catch (err) {
      return res.status(500).json({ erro: err.message || 'Erro ao enviar e-mail de recuperação.' });
    }
  }

  static async redefinirSenha(req, res) {
    try {
      const { token, novaSenha } = req.body;
      if (!token) return res.status(400).json({ erro: 'Token ausente.' });
      if (!novaSenha || novaSenha.length < 8) return res.status(400).json({ erro: 'Senha deve ter no mínimo 8 caracteres.' });

      const usuario = await usuarioModel.buscarPorTokenRedefinicao(token);
      if (!usuario) return res.status(400).json({ erro: 'Link inválido ou expirado.' });

      if (new Date() > new Date(usuario.token_expiracao)) {
        return res.status(400).json({ erro: 'Link expirado.' });
      }

      const senhaHash = await bcrypt.hash(novaSenha, 10);
      await usuarioModel.atualizarSenha(usuario.id_usuario, senhaHash);

      return res.json({ mensagem: 'Senha redefinida com sucesso!' });
    } catch (error) {
      return res.status(500).json({ erro: 'Erro ao redefinir senha.' });
    }
  }

  // --- PERFIL E MEDIDAS ---
  static async obterPerfil(req, res) {
    const { id } = req.params;
    try {
      const usuario = await usuarioModel.buscarPorId(id);
      if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
      return res.json(usuario);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao carregar dados do perfil.' });
    }
  }

  // ACEITA REMOÇÃO DA FOTO (foto_perfil pode vir null ou vazio)
  static async atualizarPerfil(req, res) {
    const { id } = req.params;
    const { nome, telefone, bio, especialidades, foto_perfil } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'O nome é obrigatório.' });
    }

    try {
      const query = `
        UPDATE usuarios 
        SET nome = $1, telefone = $2, bio = $3, especialidades = $4, foto_perfil = $5
        WHERE id_usuario = $6
        RETURNING id_usuario, nome, email, telefone, bio, especialidades, foto_perfil, tipo_usuario;
      `;

      const result = await pool.query(query, [
        nome.trim(),
        telefone || null,
        bio || null,
        especialidades || null,
        foto_perfil || null, // Se vier '', salva NULL no banco
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
      }

      return res.json({ mensagem: 'Perfil atualizado com sucesso!', usuario: result.rows[0] });
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      return res.status(500).json({ erro: 'Erro ao atualizar dados do perfil.' });
    }
  }

  // AGENDA COMPLETA (Tanto para Costureiras quanto para Clientes)
  static async obterAgenda(req, res) {
    const { id } = req.params;
    try {
      const query = `
        SELECT 
          os.id_ordem_servico,
          os.id_pedido,
          os.id_costureira,
          os.status_kanban,
          os.previsao_entrega,
          os.data_prova,
          os.horario_prova,
          p.descricao AS pedido_descricao,
          u_cli.nome AS cliente_nome,
          u_cost.nome AS costureira_nome
        FROM ordens_servico os
        JOIN pedidos p ON os.id_pedido = p.id_pedido
        LEFT JOIN usuarios u_cli ON p.id_cliente = u_cli.id_usuario
        LEFT JOIN usuarios u_cost ON os.id_costureira = u_cost.id_usuario
        WHERE p.id_cliente = $1 OR os.id_costureira = $1
        ORDER BY os.previsao_entrega ASC;
      `;
      const result = await pool.query(query, [id]);
      return res.json(result.rows);
    } catch (err) {
      console.error('Erro ao buscar agenda:', err);
      return res.status(500).json({ erro: 'Erro ao carregar compromissos da agenda.' });
    }
  }

  // --- EXCLUSÃO DE PREÇOS REFERENCIAIS / FIXOS ---
  static async deletarPrecoReferencial(req, res) {
    const { idPreco } = req.params;
    try {
      const result = await pool.query(
        'DELETE FROM tabela_precos WHERE id_preco = $1 OR id = $1 RETURNING *;',
        [idPreco]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ erro: 'Item de preço não encontrado.' });
      }
      return res.json({ mensagem: 'Item de preço excluído com sucesso!' });
    } catch (err) {
      console.error('Erro ao excluir preço:', err);
      return res.status(500).json({ erro: 'Erro ao excluir item da tabela de preços.' });
    }
  }

  static async obterMedidas(req, res) {
    const { id } = req.params;
    try {
      const medidas = await usuarioModel.buscarMedidas(id);
      if (!medidas) return res.status(404).json({ erro: 'Usuário não encontrado.' });
      return res.json(medidas);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao buscar medidas.' });
    }
  }

  static async salvarMedidas(req, res) {
    const { id } = req.params;
    try {
      await usuarioModel.atualizarMedidas(id, req.body);
      return res.json({ mensagem: 'Medidas salvas!' });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao salvar medidas.' });
    }
  }

  // --- PREFERÊNCIAS DE NOTIFICAÇÕES ---
  static async obterConfigNotificacoes(req, res) {
    const { id } = req.params;
    try {
      const config = await usuarioModel.buscarConfigNotificacoes(id);
      return res.json(config);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao carregar preferências.' });
    }
  }

  static async salvarConfigNotificacoes(req, res) {
    const { id } = req.params;
    try {
      await usuarioModel.atualizarConfigNotificacoes(id, req.body);
      return res.json({ mensagem: 'Preferências salvas!' });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao salvar preferências.' });
    }
  }
}

module.exports = UsuarioController;