const express = require('express');
const router = express.Router();
const MensagemChatController = require('../controllers/mensagemChatController');

// Suporta requisições com ou sem param :idPedido
router.get('/:idPedido', MensagemChatController.listar);
router.get('/pedido/:idPedido', MensagemChatController.listar);
router.post('/', MensagemChatController.enviar);

module.exports = router;