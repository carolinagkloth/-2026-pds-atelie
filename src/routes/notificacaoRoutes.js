const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');

router.get('/usuario/:usuario_id', notificacaoController.listarPorUsuario);
router.patch('/:id/ler', notificacaoController.marcarComoLida);

module.exports = router;