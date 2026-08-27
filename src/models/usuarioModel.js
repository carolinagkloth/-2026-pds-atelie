const db = require('../config/database');

class UsuarioModel {
  static async create({ nome, email, senha, tipo_usuario }) {
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)',
      [nome, email, senha, tipo_usuario]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0];
  }
}

module.exports = UsuarioModel;