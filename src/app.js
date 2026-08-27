const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
// const servicoRoutes = require('./routes/servicoRoutes'); // Descomente quando criar este arquivo
const pedidoRoutes = require('./routes/pedidoRoutes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
// app.use('/api/servicos', servicoRoutes); // Descomente quando criar este arquivo
app.use('/api/pedidos', pedidoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));