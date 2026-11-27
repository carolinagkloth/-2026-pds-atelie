const errorMiddleware = (err, req, res, next) => {
  console.error('[ERRO INTERNO]:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Ocorreu um erro interno no servidor.';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
};

module.exports = errorMiddleware;