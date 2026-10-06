const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Registro das Rotas
app.use('/api/usuario', usuarioRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/ordens-servico', ordemServicoRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/mensagens', mensagemChatRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);

// Tratamento global de erros (deve ser declarado APÓS as rotas)
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));