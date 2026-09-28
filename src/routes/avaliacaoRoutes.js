const express = require('express');
const router = express.Router();
const AvaliacaoController = require('../controllers/avaliacaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const autorizarPerfis = require('../middlewares/rbacMiddleware');

router.use(authMiddleware);

router.post('/', autorizarPerfis('Cliente'), AvaliacaoController.criar);
router.get('/costureira/:costureiraId', AvaliacaoController.listarPorCostureira);

module.exports = router;