const AuthService = require('../services/authService'); // Declaração

class UsuarioController {
  static async cadastrar(req, res) {
    try {
      // Leitura da variável AuthService
      const usuario = await AuthService.cadastrar(req.body);
      return res.status(201).json({ 
        message: 'Usuário cadastrado com sucesso!', 
        usuario 
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      // Leitura da variável AuthService
      const resultado = await AuthService.login(req.body);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }
}

module.exports = UsuarioController;