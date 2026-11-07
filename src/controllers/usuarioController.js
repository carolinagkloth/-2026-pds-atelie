const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const usuarioModel = require('../models/usuarioModel');
const { enviarEmailNovoAcesso, enviarEmailRecuperacao } = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class UsuarioController {
  // --- AUTENTICAÇÃO E CONTA ---
  static async cadastrar(req, res) {
    try {
      const { nome, email, senha, telefone, cpf_cnpj, tipo_usuario } = req.body;

      if (!nome || !email || !senha || !telefone) {
        return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios (nome, e-mail, senha e telefone).' });
      }

      if (senha.length < 8) {
        return res.status(400).json({ erro: 'A senha deve conter no mínimo 8 caracteres.' });
      }

      const usuarioExistente = await usuarioModel.buscarPorEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      const perfil = tipo_usuario || 'Cliente';

      const novoUser = await usuarioModel.criarUsuario({
        nome,
        email,
        senhaHash,
        telefone,
        cpf_cnpj,
        perfil
      });

      return res.status(201).json({
        mensagem: 'Usuário cadastrado com sucesso!',
        usuario: novoUser
      });
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return res.status(500).json({ erro: 'Erro interno ao realizar cadastro.' });
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

  static async atualizarPerfil(req, res) {
    const { id } = req.params;
    const { nome, telefone, bio, especialidades, foto_perfil } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'O nome é obrigatório.' });
    }

    try {
      const usuarioAtualizado = await usuarioModel.atualizarPerfil(id, {
        nome: nome.trim(),
        telefone,
        bio,
        especialidades,
        foto_perfil
      });

      if (!usuarioAtualizado) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
      }

      return res.json({ mensagem: 'Perfil atualizado com sucesso!', usuario: usuarioAtualizado });
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      return res.status(500).json({ erro: 'Erro ao atualizar dados do perfil.' });
    }
  }

  static async obterAgenda(req, res) {
    const { id } = req.params;
    try {
      const agenda = await usuarioModel.buscarAgendaUsuario(id);
      return res.json(agenda);
    } catch (err) {
      console.error('Erro ao buscar agenda:', err);
      return res.status(500).json({ erro: 'Erro ao carregar compromissos da agenda.' });
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