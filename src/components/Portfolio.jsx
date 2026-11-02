import React, { useState, useEffect } from 'react';

function Portfolio({ idCostureira, modoEdicao = false }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  // Formulário de novo item
  const [titulo, setTitulo] = useState('');
  const [imagemBase64, setImagemBase64] = useState('');
  const [mostrarModalAdd, setMostrarModalAdd] = useState(false);

  const carregarPortfolio = async () => {
    if (!idCostureira) return;
    try {
      const response = await fetch(`/api/portfolio/${idCostureira}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao carregar galeria.');
      setItens(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPortfolio();
  }, [idCostureira]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!imagemBase64) return alert('Selecione uma imagem para enviar.');

    setEnviando(true);
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_costureira: idCostureira,
          url_imagem: imagemBase64,
          titulo_trabalho: titulo
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao salvar item.');

      setTitulo('');
      setImagemBase64('');
      setMostrarModalAdd(false);
      carregarPortfolio();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluir = async (idMidia) => {
    if (!window.confirm('Deseja remover esta foto do seu portfólio?')) return;

    try {
      const response = await fetch(`/api/portfolio/${idMidia}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao excluir foto.');

      setItens((prev) => prev.filter((item) => item.id !== idMidia));
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  return (
    <div style={{ marginTop: '30px', borderTop: '2px solid #F4EFF5', paddingTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ color: '#3E2445', margin: 0, fontSize: '18px' }}>Portfólio de Trabalhos</h3>
        
        {modoEdicao && (
          <button
            onClick={() => setMostrarModalAdd(true)}
            style={{ padding: '8px 14px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            + Adicionar Foto
          </button>
        )}
      </div>

      {carregando && <p style={{ color: '#666', fontSize: '13px' }}>Carregando fotos do portfólio...</p>}
      {erro && <div style={{ color: '#c62828', fontSize: '13px' }}>{erro}</div>}

      {!carregando && itens.length === 0 && (
        <p style={{ color: '#888', fontSize: '13px', fontStyle: 'italic' }}>
          Nenhum trabalho publicado no portfólio ainda.
        </p>
      )}

      {/* Grid da Galeria de Fotos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', marginTop: '15px' }}>
        {itens.map((item) => (
          <div
            key={item.id}
            style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              background: '#f9f9f9',
              border: '1px solid #eee'
            }}
          >
            <img
              src={item.urlImagem}
              alt={item.tituloTrabalho || 'Trabalho de costura'}
              style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
            />
            
            {item.tituloTrabalho && (
              <div style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', background: '#fff' }}>
                {item.tituloTrabalho}
              </div>
            )}

            {modoEdicao && (
              <button
                onClick={() => handleExcluir(item.id)}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: 'rgba(198, 40, 40, 0.85)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
                title="Excluir foto"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal para adicionar nova foto */}
      {mostrarModalAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h4 style={{ marginTop: 0, color: '#3E2445', fontSize: '16px' }}>Publicar no Portfólio</h4>

            <form onSubmit={handleSalvar}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Título / Descrição da Peça:</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Vestido de Festa em Cetim"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Selecione a Foto:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ width: '100%', fontSize: '13px' }}
                  required
                />
              </div>

              {imagemBase64 && (
                <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                  <img src={imagemBase64} alt="Prévia" style={{ maxHeight: '120px', borderRadius: '6px' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalAdd(false)}
                  style={{ padding: '8px 14px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  style={{ padding: '8px 14px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  {enviando ? 'Salvando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Portfolio;