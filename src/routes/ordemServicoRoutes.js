const express = require('express');
const router = express.Router();
const OrdemServicoController = require('../controllers/ordemServicoController');

// Endpoints Principais
router.post('/', OrdemServicoController.criar);
router.get('/', OrdemServicoController.listarTodos);
router.post('/aceitar-proposta', OrdemServicoController.aceitarProposta);
router.post('/recusar-proposta', OrdemServicoController.recusarProposta);
router.post('/agendar-prova', OrdemServicoController.agendarProva);
router.post('/cancelar-prova', OrdemServicoController.cancelarProva);

// Endpoints do Fluxo de Conclusão e Entrega
router.post('/concluir', OrdemServicoController.concluirServico);
router.post('/confirmar-entrega', OrdemServicoController.confirmarEntrega);

// Endpoints Específicos
router.get('/:id', OrdemServicoController.buscarPorId);
router.get('/usuario/:idUsuario', OrdemServicoController.listarPorUsuario);
router.patch('/:id/status', OrdemServicoController.atualizarStatus);
router.put('/:idOrdem/status', OrdemServicoController.atualizarStatus);

module.exports = router;