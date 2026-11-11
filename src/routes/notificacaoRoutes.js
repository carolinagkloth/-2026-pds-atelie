const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');

router.get('/usuario/:usuario_id', notificacaoController.listarPorUsuario);
router.patch('/:idNotificacao/lida', notificacaoController.marcarComoLida);
router.patch('/usuario/:idUsuario/marcar-todas', notificacaoController.marcarTodasComoLidas);
router.patch('/:id/ler', notificacaoController.marcarComoLida);

module.exports = router;