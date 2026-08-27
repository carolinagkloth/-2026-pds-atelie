const express = require('express');
const router = express.Router();
const PedidoController = require('../controllers/pedidoController');
const autenticarToken = require('../middlewares/authMiddleware'); // Importou?

router.use(autenticarToken); // Ativou antes das rotas?

router.post('/', PedidoController.criar);
router.get('/', PedidoController.listarTodos);
router.get('/:id', PedidoController.buscarPorId);
router.patch('/:id/status', PedidoController.atualizarStatus);

module.exports = router;