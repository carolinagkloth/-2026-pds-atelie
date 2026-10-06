const AuthService = require('../services/authService');

class UsuarioController {
  static async cadastrar(req, res) {
    try {
      const usuario = await AuthService.cadastrar(req.body);
      return res.status(201).json({ 
        message: 'Usuário cadastrado com sucesso!', 
        usuario 
      });
    } catch (error) {
      return res.status(400).json({ 
        error: error.message || 'Erro ao cadastrar usuário.' 
      });
    }
  }

  static async login(req, res) {
    try {
      const resultado = await AuthService.login(req.body);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(401).json({ 
        error: error.message || 'E-mail ou senha inválidos.' 
      });
    }
  }
}

module.exports = UsuarioController;