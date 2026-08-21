const db = require('../config/database');

class UserModel {
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0];
  }

  static async create({ nome, email, senhaHash, perfil }) {
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
      [nome, email, senhaHash, perfil]
    );
    return result.insertId;
  }
}

module.exports = UserModel;