import React, { useState } from 'react';
import '../styles/PublicarPedido.css';

export default function PublicarPedido({ onSubmit }) {
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: '',
    descricao: '',
    localizacao: '', // Armazena Cidade e Estado (ex: Ponta Grossa - PR)
    prazo: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Falha ao cadastrar no servidor');
      }

      const data = await response.json();
      alert('Pedido publicado com sucesso!');

      if (onSubmit) {
        onSubmit(data.pedido || formData);
      }
    } catch (error) {
      console.error('Erro ao conectar com a API:', error);
      if (onSubmit) {
        onSubmit(formData);
      }
      alert('Pedido publicado na tela local!');
    } finally {
      setLoading(false);
      setFormData({
        titulo: '',
        categoria: '',
        descricao: '',
        localizacao: '',
        prazo: ''
      });
    }
  };

  return (
    <div className="publicar-container">
      <div className="publicar-card">
        <header className="publicar-header">
          <h2>Publicar Novo Pedido</h2>
          <p>Preencha os detalhes da sua solicitação para os costureiros do ateliê</p>
        </header>

        <form onSubmit={handleSubmit} className="publicar-form">
          <div className="form-group">
            <label htmlFor="titulo">Título do Pedido *</label>
            <input
              id="titulo"
              type="text"
              name="titulo"
              placeholder="Ex: Ajuste de bainha em calça jeans"
              value={formData.titulo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="categoria">Categoria do Serviço *</label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
              >
                <option value="">Selecione uma opção...</option>
                <option value="Ajustes e Reparos">Ajustes e Reparos</option>
                <option value="Confecção Sob Medida">Confecção Sob Medida</option>
                <option value="Reformas e Customização">Reformas e Customização</option>
                <option value="Bordados e Acabamentos">Bordados e Acabamentos</option>
                <option value="Vestidos de Festa">Vestidos de Festa</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="form-group flex-1">
              <label htmlFor="prazo">Prazo Desejado</label>
              <input
                id="prazo"
                type="date"
                name="prazo"
                value={formData.prazo}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Campo Único de Cidade e Estado */}
          <div className="form-group">
            <label htmlFor="localizacao">Cidade e Estado</label>
            <input
              id="localizacao"
              type="text"
              name="localizacao"
              placeholder="Ex: Ponta Grossa - PR"
              value={formData.localizacao}
              onChange={handleChange}
            />
          </div>

          {/* Campo de Descrição Expandido */}
          <div className="form-group">
            <label htmlFor="descricao">Descrição Detalhada *</label>
            <textarea
              id="descricao"
              name="descricao"
              rows="6"
              className="textarea-descricao"
              placeholder="Descreva os detalhes do serviço: tecidos, medidas, quantidade de peças ou observações importantes..."
              value={formData.descricao}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Publicar Pedido'}
          </button>
        </form>
      </div>
    </div>
  );
}