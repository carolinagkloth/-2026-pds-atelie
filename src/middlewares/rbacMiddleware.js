const autorizarPerfis = (...perfisPermitidos) => {
  return (req, res, next) => {
    if (!req.tipoUsuario || !perfisPermitidos.includes(req.tipoUsuario)) {
      return res.status(403).json({ 
        error: 'Acesso negado: seu perfil não possui permissão para este recurso.' 
      });
    }
    next();
  };
};

module.exports = autorizarPerfis;