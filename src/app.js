const express = require('express');
const cors = require('cors');
const app = express();

require('dotenv').config();

app.use(cors());
app.use(express.json());

const usuarioRoutes = require('./routes/usuarioRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const ordemServicoRoutes = require('./routes/ordemServicoRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes'); 

app.use('/api/usuario', usuarioRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/ordens-servico', ordemServicoRoutes);
app.use('/api/portfolio', portfolioRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));