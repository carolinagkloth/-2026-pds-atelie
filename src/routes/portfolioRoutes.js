const express = require('express');
const router = express.Router();
const PortfolioController = require('../controllers/portfolioController');

// Listar todo o portfólio da plataforma (Pública)
router.get('/', PortfolioController.listarTodos);

// Criar item no portfólio
router.post('/', PortfolioController.criar);

// Listar por costureira específica (Suporta ambas as assinaturas de rota)
router.get('/costureira/:id_costureira', PortfolioController.listarPorCostureira);
router.get('/:idCostureira', PortfolioController.listarPorCostureira);

// Deletar item do portfólio
router.delete('/:id', PortfolioController.deletar);
router.delete('/midia/:idMidia', PortfolioController.deletar);

module.exports = router;