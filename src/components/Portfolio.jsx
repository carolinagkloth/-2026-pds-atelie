import React, { useState, useEffect } from 'react';

function Portfolio({ idCostureira, modoEdicao = false, onNavigate }) {
  const [itens, setItens] = useState([]);
  const [costureiraInfo, setCostureiraInfo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  // Formulário de novo item
  const [titulo, setTitulo] = useState('');
  const [imagemBase64, setImagemBase64] = useState('');
  const [mostrarModalAdd, setMostrarModalAdd] = useState(false);

  // Carrega os dados da costureira e a galeria
  useEffect(() => {
    if (!idCostureira) return;

    const carregarDados = async () => {
      setCarregando(true);
      try {
        // Busca dados da costureira e do portfólio em paralelo
        const [resPortfolio, resUser] = await Promise.all([
          fetch(`/api/portfolio/${idCostureira}`),
          fetch(`/api/usuarios/${idCostureira}`).catch(() => null)
        ]);

        const dataPortfolio = await resPortfolio.json();
        if (!resPortfolio.ok) throw new Error(dataPortfolio.erro || 'Erro ao carregar galeria.');
        setItens(Array.isArray(dataPortfolio) ? dataPortfolio : []);

        if (resUser && resUser.ok) {
          const dataUser = await resUser.json();
          setCostureiraInfo(dataUser);
        }
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
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
      
      // Recarrega lista
      const res = await fetch(`/api/portfolio/${idCostureira}`);
      const novotItens = await res.json();
      setItens(Array.isArray(novotItens) ? novotItens : []);
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

      setItens((prev) => prev.filter((item) => (item.id || item.id_portfolio) !== idMidia));
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      
      {/* Botão de Voltar */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('meusChats')}
          style={{ padding: '8px 14px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '15px' }}
        >
          ← Voltar para Conversas
        </button>
      )}

      {/* Cartão de Apresentação da Costureira */}
      <div style={{ background: '#fff', padding: '20px 25px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#3E2445', margin: '0 0 6px 0', fontSize: '22px' }}>
            Portfólio de {costureiraInfo?.nome || 'Costureira'}
          </h2>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            {modoEdicao 
              ? 'Gerencie as fotos dos seus trabalhos para atrair mais clientes.' 
              : 'Confira a galeria de trabalhos e peças sob medida já confeccionadas.'}
          </p>
        </div>

        {modoEdicao && (
          <button
            onClick={() => setMostrarModalAdd(true)}
            style={{ padding: '10px 18px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
          >
            + Adicionar Foto
          </button>
        )}
      </div>

      {carregando && <p style={{ color: '#666', fontSize: '14px' }}>Carregando portfólio...</p>}
      {erro && <div style={{ color: '#c62828', fontSize: '14px', marginBottom: '15px' }}>{erro}</div>}

      {!carregando && itens.length === 0 && (
        <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#888' }}>
          <p style={{ fontSize: '15px', fontStyle: 'italic', margin: 0 }}>
            Nenhum trabalho publicado neste portfólio ainda.
          </p>
        </div>
      )}

      {/* Grid da Galeria de Fotos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {itens.map((item) => {
          const idFoto = item.id || item.id_portfolio;
          return (
            <div
              key={idFoto}
              style={{
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                background: '#fff',
                border: '1px solid #EADCEB'
              }}
            >
              <img
                src={item.urlImagem || item.url_imagem}
                alt={item.tituloTrabalho || item.titulo_trabalho || 'Trabalho de costura'}
                style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
              />
              
              {(item.tituloTrabalho || item.titulo_trabalho) && (
                <div style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', background: '#fff' }}>
                  {item.tituloTrabalho || item.titulo_trabalho}
                </div>
              )}

              {modoEdicao && (
                <button
                  onClick={() => handleExcluir(idFoto)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(198, 40, 40, 0.9)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Excluir foto"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal para adicionar nova foto */}
      {mostrarModalAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h4 style={{ marginTop: 0, color: '#3E2445', fontSize: '18px' }}>Publicar no Portfólio</h4>

            <form onSubmit={handleSalvar}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Título / Descrição da Peça:</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Vestido de Festa em Cetim"
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
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
                  <img src={imagemBase64} alt="Prévia" style={{ maxHeight: '140px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalAdd(false)}
                  style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
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