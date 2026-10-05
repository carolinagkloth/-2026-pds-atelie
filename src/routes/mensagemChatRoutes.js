const express = require('express');
const router = express.Router();
const MensagemChatController = require('../controllers/mensagemChatController');
const autenticarToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/', autenticarToken, upload.single('anexo'), MensagemChatController.enviar);
router.get('/pedido/:idPedido', autenticarToken, MensagemChatController.listar);

module.exports = router;