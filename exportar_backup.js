require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fazerBackup() {
  try {
    const usuarios = await pool.query('SELECT * FROM usuarios');
    const pedidos = await pool.query('SELECT * FROM pedidos');

    const dados = {
      data_backup: new Date().toISOString(),
      usuarios: usuarios.rows,
      pedidos: pedidos.rows
    };

    fs.writeFileSync('backup_atelie.json', JSON.stringify(dados, null, 2));
    console.log('✅ Backup concluído! Arquivo "backup_atelie.json" gerado com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao gerar backup:', err);
  } finally {
    await pool.end();
  }
}

fazerBackup();