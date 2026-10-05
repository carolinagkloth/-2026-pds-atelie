const autorizarPerfis = (...perfisPermitidos) => {
  // Achata a lista de perfis para aceitar tanto 'Cliente' quanto ['Cliente']
  const perfisValidos = perfisPermitidos.flat().map(p => String(p).toLowerCase());

  return (req, res, next) => {
    // Busca o tipo do usuário no req.tipo_usuario ou dentro de req.usuario
    const tipoUsuario = req.tipo_usuario || req.usuario?.tipo_usuario || req.usuario?.tipo || req.usuario?.perfil;

    
    if (!tipoUsuario) {
      return res.status(403).json({ 
        error: 'Acesso negado: perfil do utilizador não identificado.' 
      });
    }

    if (!perfisValidos.includes(tipoUsuario.toLowerCase())) {
      return res.status(403).json({ 
        error: 'Acesso negado: seu perfil não possui permissão para este recurso.' 
      });
    }

    next();
  };
};

module.exports = autorizarPerfis;