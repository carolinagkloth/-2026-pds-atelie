const db = require('../config/database');

class UsuarioModel {
  static async criar({ nome, email, senha, tipo_usuario }) {
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)',
      [nome, email, senha, tipo_usuario]
    );
    return result.insertId;
  }

  // Buscar usuário por ID
static async buscarPorId(id_usuario) {
  const query = 'SELECT * FROM usuarios WHERE id_usuario = ?';
  const [linhas] = await db.execute(query, [id_usuario]);
  return linhas[0]; // Retorna o usuário encontrado ou undefined
}

  static async buscarPorEmail(email) {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0];
  }
}

module.exports = UsuarioModel;