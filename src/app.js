const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Impede que falhas assíncronas (SMTP, WhatsApp, rede) derrubem o servidor
process.on('uncaughtException', (err) => {
  console.error('Exceção não capturada (servidor mantido ativo):', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Promessa rejeitada não tratada (servidor mantido ativo):', reason);
});

// Middlewares globais
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir arquivos estáticos (upload de fotos e anexos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importação das Rotas
const usuarioRoutes = require('./routes/usuarioRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const ordemServicoRoutes = require('./routes/ordemServicoRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const mensagemChatRoutes = require('./routes/mensagemChatRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');

// Importação do Middleware Global de Erro
const errorMiddleware = require('./middlewares/errorMiddleware');

require('./config/whatsapp');
const { iniciarCronJobs } = require('./jobs/lembretesJob');
iniciarCronJobs();

// Registro das Rotas da API (com aliases no singular, plural e raiz /api)
app.use('/api/usuario', usuarioRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api', usuarioRoutes);

app.use('/api/pedidos', pedidoRoutes);
app.use('/api/pedido', pedidoRoutes);

app.use('/api/ordens-servico', ordemServicoRoutes);
app.use('/api/ordem-servico', ordemServicoRoutes);
app.use('/api/ordens', ordemServicoRoutes);

app.use('/api/portfolio', portfolioRoutes);
app.use('/api/portfolios', portfolioRoutes);

app.use('/api/mensagens-chat', mensagemChatRoutes);
app.use('/api/mensagem-chat', mensagemChatRoutes);
app.use('/api/mensagens', mensagemChatRoutes);
app.use('/api/mensagem', mensagemChatRoutes);
app.use('/api/chat', mensagemChatRoutes);
app.use('/api/conversas', mensagemChatRoutes);

app.use('/api/avaliacoes', avaliacaoRoutes);
app.use('/api/avaliacao', avaliacaoRoutes);

app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/notificacao', notificacaoRoutes);

// Tratamento global de erros das rotas da API
app.use(errorMiddleware);

// Garante resposta JSON 404 para qualquer rota /api inexistente
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Rota da API não encontrada: ${req.method} ${req.originalUrl}` });
});

// Servir o Front-end React (build do Vite) em produção
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const QRCode = require('qrcode');
const whatsappClient = require('./config/whatsapp');

app.get('/qr-whatsapp', async (req, res) => {
  if (!whatsappClient.ultimoQr) {
    return res.send('<h2>WhatsApp já está conectado ou o QR Code ainda está carregando. Atualize a página em 5 segundos.</h2>');
  }
  const qrImagem = await QRCode.toDataURL(whatsappClient.ultimoQr);
  res.send(`
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
      <h2>Escaneie com o WhatsApp do Ateliê</h2>
      <img src="${qrImagem}" style="width:300px;height:300px;" />
      <p>Se expirar, atualize esta página (F5).</p>
    </div>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));