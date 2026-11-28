require('dotenv').config();
const { Pool } = require('pg');

const isInternal = process.env.DATABASE_URL?.includes('railway.internal');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,                  // evita estourar o limite de conexões do plano
  idleTimeoutMillis: 30000, // fecha conexões ociosas antes do proxy derrubar
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('Aviso em cliente ocioso do PostgreSQL:', err.message);
});

// Blindagem: se o proxy cortar uma conexão ociosa bem na hora da consulta, refaz 1x automaticamente
const queryOriginal = pool.query.bind(pool);
pool.query = async (...args) => {
  try {
    return await queryOriginal(...args);
  } catch (err) {
    const quedaTransitoria =
      err?.message?.includes('Connection terminated') ||
      err?.message?.includes('connection timeout') ||
      err?.code === 'ECONNRESET';

    if (quedaTransitoria) {
      return await queryOriginal(...args);
    }
    throw err;
  }
};

module.exports = pool;