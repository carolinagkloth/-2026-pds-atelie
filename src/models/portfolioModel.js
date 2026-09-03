const db = require('../config/database');

class PortfolioModel {

static async criar({ id_costureira, titulo_trabalho, url_imagem, data_publicacao }) {
  // Se a data não for enviada no JSON, atribui o momento exato do envio
  const dataFinal = data_publicacao || new Date();
  const query = `
    INSERT INTO portfolio (id_costureira, titulo_trabalho, url_imagem, data_publicacao)
    VALUES (?, ?, ?, ?)
  `;
  const [resultado] = await db.execute(query, [id_costureira, titulo_trabalho, url_imagem, dataFinal]);
  return resultado.insertId;
}

  static async listarTodos() {
    const query = `
      SELECT p.*, u.nome AS costureira_nome
      FROM portfolio p
      INNER JOIN usuarios u ON p.id_costureira = u.id_usuario
      ORDER BY p.data_publicacao DESC
    `;
    const [linhas] = await db.execute(query);
    return linhas;
  }

  static async buscarPorCostureira(id_costureira) {
    const query = `
      SELECT * FROM portfolio 
      WHERE id_costureira = ? 
      ORDER BY data_publicacao DESC
    `;
    const [linhas] = await db.execute(query, [id_costureira]);
    return linhas;
  }

  static async buscarPorId(id_midia) {
    const query = 'SELECT * FROM portfolio WHERE id_midia = ?';
    const [linhas] = await db.execute(query, [id_midia]);
    return linhas[0];
  }

  static async deletar(id_midia) {
    const query = 'DELETE FROM portfolio WHERE id_midia = ?';
    const [resultado] = await db.execute(query, [id_midia]);
    return resultado.affectedRows > 0;
  }
}

module.exports = PortfolioModel;