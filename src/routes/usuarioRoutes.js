const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController');

// Auth & Senha
router.post('/cadastro', UsuarioController.cadastrar);
router.post('/cadastrar', UsuarioController.cadastrar);
router.post('/login', UsuarioController.login);
router.post('/auth/google', UsuarioController.googleAuth);
router.post('/recuperar-senha', UsuarioController.recuperarSenha);
router.post('/redefinir-senha', UsuarioController.redefinirSenha);

// Perfil & Medidas (inclui atualização de perfil e consulta de agenda)
router.get('/usuarios/:id', UsuarioController.obterPerfil);
router.put('/usuarios/:id', UsuarioController.atualizarPerfil);
router.get('/usuarios/:id/agenda', UsuarioController.obterAgenda);

router.get('/usuarios/:id/medidas', UsuarioController.obterMedidas);
router.put('/usuarios/:id/medidas', UsuarioController.salvarMedidas);

// Preferências de Notificações
router.get('/usuarios/:id/configuracoes-notificacoes', UsuarioController.obterConfigNotificacoes);
router.put('/usuarios/:id/configuracoes-notificacoes', UsuarioController.salvarConfigNotificacoes);

module.exports = router;