const jwt = require('jsonwebtoken');

function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta', (err, usuario) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    req.usuario = usuario;
    req.usuarioId = usuario.id;
    req.tipo_usuario = usuario.tipo_usuario || usuario.tipo || usuario.perfil; // Adicionado para o RBAC

    next();
  });
}

module.exports = autenticarToken;