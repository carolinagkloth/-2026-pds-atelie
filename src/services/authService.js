const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuarioModel');

class AuthService {
  static async cadastrar({ nome, email, senha, tipo_usuario }) {
    const userExists = await UsuarioModel.buscarPorEmail(email);
    if (userExists) throw new Error('E-mail já cadastrado.');

    const senhaHash = await bcrypt.hash(senha, 10);
    
    // Corrigido para 'criar' e alinhado aos nomes esperados no model
    const userId = await UsuarioModel.criar({ 
      nome, 
      email, 
      senha: senhaHash, 
      tipo_usuario 
    });

    return { id_usuario: userId, nome, email, tipo_usuario };
  }

  static async login({ email, senha }) {
    const user = await UsuarioModel.buscarPorEmail(email);
    if (!user) throw new Error('Credenciais inválidas.');

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) throw new Error('Credenciais inválidas.');

    // Corrigido para usar as colunas id_usuario e tipo_usuario do MySQL
    const token = jwt.sign(
      { id: user.id_usuario, tipo: user.tipo_usuario },
      process.env.JWT_SECRET || 'chave_secreta',
      { expiresIn: '1d' }
    );

    return {
      user: { 
        id_usuario: user.id_usuario, 
        nome: user.nome, 
        email: user.email, 
        tipo_usuario: user.tipo_usuario 
      },
      token
    };
  }
}

module.exports = AuthService;