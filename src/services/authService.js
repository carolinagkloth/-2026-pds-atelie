const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

class AuthService {
  static async register({ nome, email, senha, perfil }) {
    const userExists = await UserModel.findByEmail(email);
    if (userExists) throw new Error('E-mail já cadastrado.');

    const senhaHash = await bcrypt.hash(senha, 10);
    const userId = await UserModel.create({ nome, email, senhaHash, perfil });

    return { id: userId, nome, email, perfil };
  }

  static async login({ email, senha }) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error('Credenciais inválidas.');

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) throw new Error('Credenciais inválidas.');

    const token = jwt.sign(
      { id: user.id, perfil: user.perfil },
      process.env.JWT_SECRET || 'chave_secreta',
      { expiresIn: '1d' }
    );

    return {
      user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil },
      token
    };
  }
}

module.exports = AuthService;