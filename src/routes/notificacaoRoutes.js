const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');

// Listar notificações do usuário
router.get('/usuario/:idUsuario', notificacaoController.listarPorUsuario);

// Marcar uma notificação como lida (aceita PUT e PATCH)
router.put('/:idNotificacao/lida', notificacaoController.marcarComoLida);
router.patch('/:idNotificacao/lida', notificacaoController.marcarComoLida);
router.put('/:idNotificacao/ler', notificacaoController.marcarComoLida);
router.patch('/:idNotificacao/ler', notificacaoController.marcarComoLida);

// Marcar todas como lidas (aceita PUT/PATCH e ambos os caminhos)
router.put('/usuario/:idUsuario/marcar-todas-lidas', notificacaoController.marcarTodasComoLidas);
router.patch('/usuario/:idUsuario/marcar-todas-lidas', notificacaoController.marcarTodasComoLidas);
router.put('/usuario/:idUsuario/marcar-todas', notificacaoController.marcarTodasComoLidas);
router.patch('/usuario/:idUsuario/marcar-todas', notificacaoController.marcarTodasComoLidas);

module.exports = router;