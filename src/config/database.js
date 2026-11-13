require('dotenv').config();
const { Pool } = require('pg');

const fusoLocalPC = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  options: `-c timezone=${fusoLocalPC}`
});

module.exports = pool;