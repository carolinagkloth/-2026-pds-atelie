const express = require('express');
const router = express.Router();
const OrdemServicoController = require('../controllers/ordemServicoController');
const autenticarToken = require('../middlewares/authMiddleware');

// Exige token JWT para todas as rotas de Ordens de Serviço
router.use(autenticarToken);

router.post('/', OrdemServicoController.criar);
router.get('/', OrdemServicoController.listarTodos);
router.get('/:id', OrdemServicoController.buscarPorId);
router.patch('/:id/status', OrdemServicoController.atualizarStatus);

module.exports = router;