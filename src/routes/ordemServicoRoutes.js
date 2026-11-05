const express = require('express');
const router = express.Router();
const OrdemServicoController = require('../controllers/ordemServicoController');

// Endpoints Principais
router.post('/', OrdemServicoController.criar);
router.get('/', OrdemServicoController.listarTodos);
router.post('/aceitar-proposta', OrdemServicoController.aceitarProposta);
router.post('/agendar-prova', OrdemServicoController.agendarProva);

// Endpoints Específicos
router.get('/:id', OrdemServicoController.buscarPorId);
router.get('/usuario/:idUsuario', OrdemServicoController.listarPorUsuario);
router.patch('/:id/status', OrdemServicoController.atualizarStatus);
router.put('/:idOrdem/status', OrdemServicoController.atualizarStatus);

module.exports = router;