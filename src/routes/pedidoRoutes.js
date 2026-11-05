const express = require('express');
const router = express.Router();
const PedidoController = require('../controllers/pedidoController');

// Endpoints de Pedidos
router.get('/', PedidoController.listarTodos);
router.post('/', PedidoController.criar);
router.get('/:id', PedidoController.buscarPorId);
router.put('/:id', PedidoController.atualizar);
router.patch('/:id/status', PedidoController.atualizarStatus);
router.delete('/:id', PedidoController.deletar);

module.exports = router;