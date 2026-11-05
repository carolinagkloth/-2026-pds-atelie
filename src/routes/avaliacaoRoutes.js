const express = require('express');
const router = express.Router();
const AvaliacaoController = require('../controllers/avaliacaoController');

// Endpoints de Avaliações
router.post('/', AvaliacaoController.criar);

// Suporta idCostureira e costureiraId
router.get('/costureira/:idCostureira', AvaliacaoController.listarPorCostureira);
router.get('/costureira/:costureiraId', AvaliacaoController.listarPorCostureira);

router.get('/media/costureira/:idCostureira', AvaliacaoController.obterMediaCostureira);
router.get('/media/costureira/:costureiraId', AvaliacaoController.obterMediaCostureira);

module.exports = router;