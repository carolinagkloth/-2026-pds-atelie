import React, { useState } from 'react';

function PublicarPedido({ usuario, usuarioLogado, onNavigate, onPublicarSucesso }) {
  const sessaoSalva = JSON.parse(localStorage.getItem('usuarioAtelie') || '{}');
  const user = usuario || usuarioLogado || sessaoSalva;

  const [tiposervico, setTiposervico] = useState('Ajuste / Conserto');
  const [descricao, setDescricao] = useState('');
  const [prazoDesejado, setPrazoDesejado] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [previewFoto, setPreviewFoto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const hoje = new Date().toISOString().split('T')[0];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!descricao || !prazoDesejado || !localizacao) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    const idCliente = user?.id_usuario || user?.id;

    if (!idCliente) {
      alert('Sessão expirada ou usuário não identificado. Faça login novamente.');
      return;
    }

    setCarregando(true);

    try {
      const descricaoFormatada = `[${tiposervico}] - Localização: ${localizacao}\n\n${descricao}`;

      const response = await fetch('http://localhost:3000/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: idCliente,
          descricao: descricaoFormatada,
          fotos_referencia: previewFoto || null,
          prazo_desejado: prazoDesejado
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao publicar o pedido.');
      }

      const novoPedido = data.pedido || {
        id: Date.now(),
        clienteId: idCliente,
        clienteNome: user?.nome || 'Cliente',
        tiposervico,
        descricao,
        prazoDesejado,
        localizacao,
        fotoReferencia: previewFoto || null,
        status: 'Aberto',
        dataPublicacao: new Date().toLocaleDateString()
      };

      if (onPublicarSucesso) {
        onPublicarSucesso(novoPedido);
      }

      alert('Pedido publicado com sucesso!');

      if (onNavigate) {
        onNavigate('pedidos');
      }
    } catch (err) {
      setErro(err.message);
      alert(`Erro: ${err.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#3E2445', marginTop: 0 }}>Publicar Novo Pedido</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
        Descreva o serviço de costura ou ajuste que você precisa para que as costureiras da região possam visualizar.
      </p>

      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{erro}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Tipo de Serviço *</label>
          <select 
            value={tiposervico} 
            onChange={(e) => setTiposervico(e.target.value)} 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="Ajuste / Conserto">Ajuste / Conserto</option>
            <option value="Confecção sob Medida">Confecção sob Medida</option>
            <option value="Customização / Bordado">Customização / Bordado</option>
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
              min={hoje}
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

          {previewFoto && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>Pré-visualização:</p>
              <img src={previewFoto} alt="Pré-visualização" style={{ maxHeight: '150px', borderRadius: '6px', border: '1px solid #ddd' }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            disabled={carregando}
            style={{ flex: 1, padding: '12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
          >
            {carregando ? 'Publicando...' : 'Publicar no Mural de Pedidos'}
          </button>
          
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('pedidos')}
              style={{ padding: '12px 20px', background: '#757575', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default PublicarPedido;