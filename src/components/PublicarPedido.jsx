import React, { useState } from 'react';

function PublicarPedido({ usuarioLogado, onPublicarSucesso }) {
  const [tiposervico, setTiposervico] = useState('Ajuste');
  const [descricao, setDescricao] = useState('');
  const [prazoDesejado, setPrazoDesejado] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [fotoReferencia, setFotoReferencia] = useState(null);
  const [previewFoto, setPreviewFoto] = useState('');

  // Pega a data atual no formato YYYY-MM-DD para bloquear datas passadas no calendário
  const hoje = new Date().toISOString().split('T')[0];

  // Manipula o arquivo de imagem enviado pelo usuário (PNG / JPG)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoReferencia(file);
      setPreviewFoto(URL.createObjectURL(file)); // Gera pré-visualização local da imagem
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!descricao || !prazoDesejado || !localizacao) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    const novoPedido = {
      id: Date.now(),
      clienteId: usuarioLogado?.id || 1,
      clienteNome: usuarioLogado?.nome || 'Cliente',
      tiposervico,
      descricao,
      prazoDesejado,
      localizacao,
      fotoReferencia: previewFoto || 'https://via.placeholder.com/150?text=Sem+Foto',
      status: 'Disponível',
      dataPublicacao: new Date().toLocaleDateString()
    };

    onPublicarSucesso(novoPedido);
    alert('Pedido publicado com sucesso no Mural!');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#3E2445', marginTop: 0 }}>Publicar Novo Pedido</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
        Descreva o serviço de costura ou ajuste que você precisa para que as costureiras da região possam visualizar.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Tipo de Serviço *</label>
          <select value={tiposervico} onChange={(e) => setTiposervico(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="Ajuste">Ajuste / Conserto</option>
            <option value="Confecção sob medida">Confecção sob Medida</option>
            <option value="Customização">Customização / Bordado</option>
            <option value="Vestido de Festa">Vestido de Festa</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Descrição Detalhada *</label>
          <textarea
            rows="4"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Preciso fazer a barra de uma calça jeans e apertar 2cm na cintura de um vestido..."
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Prazo Desejado *</label>
            <input
              type="date"
              min={hoje} /* Bloqueia seleção de datas anteriores a hoje */
              value={prazoDesejado}
              onChange={(e) => setPrazoDesejado(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Bairro / Localização *</label>
            <input
              type="text"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Ex: Centro - Ponta Grossa"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              required
            />
          </div>
        </div>

        {/* UPLOAD REAL DE FOTO DA PEÇA */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
            Foto de Referência da Peça (Opcional - PNG ou JPG)
          </label>
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', background: '#fafafa' }}
          />

          {/* PRÉ-VISUALIZAÇÃO DA IMAGEM SELECIONADA */}
          {previewFoto && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>Pré-visualização:</p>
              <img src={previewFoto} alt="Pré-visualização" style={{ maxHeight: '150px', borderRadius: '6px', border: '1px solid #ddd' }} />
            </div>
          )}
        </div>

        <button type="submit" style={{ width: '100%', padding: '12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
          Publicar no Mural de Pedidos
        </button>
      </form>
    </div>
  );
}

export default PublicarPedido;