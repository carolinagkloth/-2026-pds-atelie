const express = require('express');
const router = express.Router();
const MensagemChatController = require('../controllers/mensagemChatController');

// Listar conversas do usuário (sempre antes de /:idPedido)
router.get('/usuario/:idUsuario', MensagemChatController.listarConversasDoUsuario);
router.get('/usuarios/:idUsuario', MensagemChatController.listarConversasDoUsuario);

// Suporta requisições com ou sem param :idPedido
router.get('/pedido/:idPedido', MensagemChatController.listar);
router.get('/:idPedido', MensagemChatController.listar);
router.post('/', MensagemChatController.enviar);

module.exports = router;