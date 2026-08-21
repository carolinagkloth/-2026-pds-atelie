const UsuarioModel = require('../models/usuarioModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthController {
  static async register(req, res) {
    try {
      const { nome, email, senha, tipo_usuario } = req.body;

      if (!nome || !email || !senha || !tipo_usuario) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
      }

      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);

      const id_usuario = await UsuarioModel.create({ 
        nome, 
        email, 
        senha: senhaHash, 
        tipo_usuario 
      });

      return res.status(201).json({ message: 'Usuário cadastrado com sucesso!', id_usuario });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, senha } = req.body;
      const user = await UsuarioModel.findByEmail(email);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const senhaValida = await bcrypt.compare(senha, user.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }

      const token = jwt.sign(
        { id: user.id_usuario, tipo: user.tipo_usuario }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      return res.status(200).json({ message: 'Login realizado!', token });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AuthController;