require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.internal')
    ? false
    : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 20000,       // Fecha conexões paradas antes que o Railway as derrube (20s)
  connectionTimeoutMillis: 10000, // Tempo máximo para abrir nova conexão (10s)
  keepAlive: true                 // Mantém o socket TCP ativo
});

pool.on('error', (err) => {
  console.error('Erro inesperado em cliente ocioso do PostgreSQL:', err.message);
});

module.exports = pool;