const pool = require('../config/database');

class PortfolioModel {
  static async criar({ id_costureira, titulo_trabalho, url_imagem, data_publicacao }) {
    const query = `
      INSERT INTO portfolio (id_costureira, titulo_trabalho, url_imagem, data_publicacao)
      VALUES ($1, $2, $3, COALESCE($4, NOW()))
      RETURNING id_midia AS id, id_midia, id_costureira AS "idCostureira", id_costureira,
                url_imagem AS "urlImagem", url_imagem, titulo_trabalho AS "tituloTrabalho",
                titulo_trabalho, data_publicacao AS "dataPublicacao", data_publicacao;
    `;
    const result = await pool.query(query, [
      id_costureira,
      titulo_trabalho || null,
      url_imagem,
      data_publicacao || null
    ]);
    return result.rows[0];
  }

  static async listarTodos() {
    const query = `
      SELECT p.id_midia AS id, p.id_midia, p.id_costureira AS "idCostureira", p.id_costureira,
             p.url_imagem AS "urlImagem", p.url_imagem, p.titulo_trabalho AS "tituloTrabalho",
             p.titulo_trabalho, p.data_publicacao AS "dataPublicacao", p.data_publicacao,
             u.nome AS costureira_nome, u.nome AS "costureiraNome"
      FROM portfolio p
      INNER JOIN usuarios u ON p.id_costureira = u.id_usuario
      ORDER BY p.data_publicacao DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async buscarPorCostureira(id_costureira) {
    const query = `
      SELECT id_midia AS id, id_midia, id_costureira AS "idCostureira", id_costureira,
             url_imagem AS "urlImagem", url_imagem, titulo_trabalho AS "tituloTrabalho",
             titulo_trabalho, data_publicacao AS "dataPublicacao", data_publicacao
      FROM portfolio 
      WHERE id_costureira = $1 
      ORDER BY data_publicacao DESC;
    `;
    const result = await pool.query(query, [id_costureira]);
    return result.rows;
  }

  static async buscarPorId(id_midia) {
    const query = 'SELECT * FROM portfolio WHERE id_midia = $1;';
    const result = await pool.query(query, [id_midia]);
    return result.rows[0] || null;
  }

  static async deletar(id_midia) {
    const query = 'DELETE FROM portfolio WHERE id_midia = $1 RETURNING *;';
    const result = await pool.query(query, [id_midia]);
    return result.rows[0] || null;
  }
}

module.exports = PortfolioModel;