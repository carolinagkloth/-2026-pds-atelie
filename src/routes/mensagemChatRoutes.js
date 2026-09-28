const express = require('express');
const router = express.Router();
const MensagemChatController = require('../controllers/mensagemChatController');
const autenticarToken = require('../middlewares/authMiddleware');

router.post('/', autenticarToken, MensagemChatController.enviar);
router.get('/pedido/:idPedido', autenticarToken, MensagemChatController.listar);

module.exports = router;