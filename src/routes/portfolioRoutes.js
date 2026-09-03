const express = require('express');
const router = express.Router();
const PortfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middlewares/authMiddleware'); // Ajuste o caminho se necessário

// Rota para cadastrar item no portfólio (Requer autenticação)
router.post('/', authMiddleware, PortfolioController.criar);

// Rota para listar todo o portfólio da plataforma (Pública)
router.get('/', PortfolioController.listarTodos);

// Rota para listar o portfólio de uma costureira específica (Pública)
router.get('/costureira/:id_costureira', PortfolioController.listarPorCostureira);

// Rota para deletar um item do portfólio (Requer autenticação)
router.delete('/:id', authMiddleware, PortfolioController.deletar);

module.exports = router;