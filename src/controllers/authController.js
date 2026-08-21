const AuthService = require('../services/authService');

class AuthController {
  static async register(req, res) {
    try {
      const { nome, email, senha, perfil } = req.body;
      if (!nome || !email || !senha || !perfil) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
      }
      const user = await AuthService.register({ nome, email, senha, perfil });
      return res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, senha } = req.body;
      const data = await AuthService.login({ email, senha });
      return res.status(200).json(data);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }
}

module.exports = AuthController;