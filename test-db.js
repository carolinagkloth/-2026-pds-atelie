require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testarConexao() {
  try {
    const res = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';');
    console.log('✅ Conexão com o Neon realizada com sucesso!');
    console.log('Tabelas encontradas no banco:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('❌ Erro de conexão com o Neon:', err.message);
  } finally {
    await pool.end();
  }
}

testarConexao();