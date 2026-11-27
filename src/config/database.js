require('dotenv').config();
const { Pool } = require('pg');

const isInternal = process.env.DATABASE_URL?.includes('railway.internal');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isInternal ? false : { rejectUnauthorized: false },
  max: 10,
  min: 0,
  idleTimeoutMillis: 10000,          // Descarta conexões ociosas em 10s (antes do proxy do Railway cortar)
  connectionTimeoutMillis: 30000,    // Dá 30s caso o banco do Railway precise acordar (cold start)
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000  // Envia pacotes TCP keep-alive a cada 5s
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