const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

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

// Importação do Middleware Global de Erro
const errorMiddleware = require('./middlewares/errorMiddleware');

// Registro das Rotas da API
app.use('/api/usuario', usuarioRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/ordens-servico', ordemServicoRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/mensagens', mensagemChatRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);

// Tratamento global de erros das rotas da API
app.use(errorMiddleware);

// Servir o Front-end React (build do Vite) em produção
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));