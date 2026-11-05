require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Inicialização de serviços e jobs em segundo plano
require('./src/config/whatsapp');
const { iniciarCronJobs } = require('./src/jobs/lembretesJob');

// Importação das rotas
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const notificacaoRoutes = require('./src/routes/notificacaoRoutes');
const pedidoRoutes = require('./src/routes/pedidoRoutes');
const mensagemChatRoutes = require('./src/routes/mensagemChatRoutes');
const ordemServicoRoutes = require('./src/routes/ordemServicoRoutes');
const avaliacaoRoutes = require('./src/routes/avaliacaoRoutes');
const portfolioRoutes = require('./src/routes/portfolioRoutes');

// Controllers auxiliares para suporte a rotas legadas
const MensagemChatController = require('./src/controllers/mensagemChatController');
const OrdemServicoController = require('./src/controllers/ordemServicoController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares Globais
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Inicia Agendador de Tarefas (Lembretes)
iniciarCronJobs();

// Mapeamento de Rotas
app.use('/api', usuarioRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/ordens-servico', ordemServicoRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Rotas de Chat e Compatibilidade
app.use('/api/mensagens-chat', mensagemChatRoutes);
app.use('/api/chat', mensagemChatRoutes);
app.post('/api/chat/aceitar-proposta', OrdemServicoController.aceitarProposta);
app.get('/api/conversas/usuario/:idUsuario', MensagemChatController.listarConversasDoUsuario);

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(` Servidor backend rodando na porta ${PORT}`);
});