import React, { useState, useEffect } from 'react';

function Portfolio({ idCostureira, modoEdicao = false, onNavigate }) {
  const [itens, setItens] = useState([]);
  const [costureiraInfo, setCostureiraInfo] = useState(null);
  const [precos, setPrecos] = useState([]);
  const [reputacao, setReputacao] = useState({ media: 0, totalAvaliacoes: 0, depoimentos: [] });

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [erroFotoPerfil, setErroFotoPerfil] = useState(false);

  // Formulário de novo item
  const [titulo, setTitulo] = useState('');
  const [imagemBase64, setImagemBase64] = useState('');
  const [mostrarModalAdd, setMostrarModalAdd] = useState(false);

  // Identifica se está aberto como página pública completa (via chat) ou embutido no Perfil.jsx
  const exibirPerfilCompleto = Boolean(onNavigate) && !modoEdicao;

  useEffect(() => {
    if (!idCostureira) return;

    const carregarDados = async () => {
      setCarregando(true);
      setErroFotoPerfil(false);
      try {
        const requisicoes = [
          fetch(`/api/portfolio/${idCostureira}`),
          fetch(`/api/usuarios/${idCostureira}`).catch(() => null)
        ];

        if (exibirPerfilCompleto) {
          requisicoes.push(
            fetch(`/api/usuarios/${idCostureira}/tabela-precos`).catch(() => null),
            fetch(`/api/avaliacoes/costureira/${idCostureira}`).catch(() => null)
          );
        }

        const [resPortfolio, resUser, resPrecos, resAvaliacoes] = await Promise.all(requisicoes);

        const dataPortfolio = await resPortfolio.json();
        if (!resPortfolio.ok) throw new Error(dataPortfolio.erro || 'Erro ao carregar galeria.');
        setItens(Array.isArray(dataPortfolio) ? dataPortfolio : []);

        if (resUser && resUser.ok) {
          const dataUser = await resUser.json();
          setCostureiraInfo(dataUser);
        }

        if (resPrecos && resPrecos.ok) {
          const dataPrecos = await resPrecos.json();
          setPrecos(Array.isArray(dataPrecos) ? dataPrecos : []);
        }

        if (resAvaliacoes && resAvaliacoes.ok) {
          const dataAval = await resAvaliacoes.json();
          if (dataAval && !dataAval.erro) {
            setReputacao({
              media: dataAval.media || dataAval.media_nota || 0,
              totalAvaliacoes: dataAval.totalAvaliacoes || dataAval.total_avaliacoes || 0,
              depoimentos: dataAval.depoimentos || dataAval.avaliacoes || []
            });
          }
        }
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [idCostureira, exibirPerfilCompleto]);

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

      const res = await fetch(`/api/portfolio/${idCostureira}`);
      const novosItens = await res.json();
      setItens(Array.isArray(novosItens) ? novosItens : []);
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

      setItens((prev) => prev.filter((item) => (item.id || item.id_midia || item.id_portfolio) !== idMidia));
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const renderEstrelas = (nota) => {
    const valor = Math.round(nota || 0);
    return '★'.repeat(valor) + '☆'.repeat(5 - valor);
  };

  const nomeCostureira = costureiraInfo?.nome || 'Costureira';
  const primeiraLetra = nomeCostureira.trim().charAt(0).toUpperCase();

  return (
    <div
      style={{
        maxWidth: exibirPerfilCompleto ? '850px' : '100%',
        margin: exibirPerfilCompleto ? '30px auto' : '30px 0 0 0',
        padding: exibirPerfilCompleto ? '0 20px' : '20px 0 0 0',
        borderTop: exibirPerfilCompleto ? 'none' : '2px solid #F4EFF5',
        fontFamily: "'Segoe UI', Tahoma, sans-serif"
      }}
    >
      {/* Botão de Voltar (Visível na tela pública da Costureira) */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('meusChats')}
          style={{ padding: '8px 14px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '15px' }}
        >
          ← Voltar para Conversas
        </button>
      )}

      {carregando && <p style={{ color: '#666', fontSize: '14px' }}>Carregando informações da costureira...</p>}
      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '6px', fontSize: '14px', marginBottom: '15px' }}>{erro}</div>}

      {/* ===================================================================== */}
      {/* 1. CARTÃO COMPLETO DO PERFIL DA COSTUREIRA (VISÃO DA CLIENTE)         */}
      {/* ===================================================================== */}
      {!carregando && exibirPerfilCompleto && (
        <>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', marginBottom: '25px' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Foto de Perfil */}
              <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #3E2445', background: '#3E2445', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                {costureiraInfo?.foto_perfil && !erroFotoPerfil ? (
                  <img
                    src={costureiraInfo.foto_perfil}
                    alt={nomeCostureira}
                    referrerPolicy="no-referrer"
                    onError={() => setErroFotoPerfil(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ color: '#fff', fontSize: '44px', fontWeight: 'bold', userSelect: 'none' }}>
                    {primeiraLetra}
                  </span>
                )}
              </div>

              {/* Nome, Especialidade, Telefone e Endereço */}
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h2 style={{ color: '#3E2445', margin: 0, fontSize: '24px' }}>{nomeCostureira}</h2>
                  <span style={{ background: '#E8D8E8', color: '#3E2445', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    Costureira Profissional
                  </span>
                </div>

                {costureiraInfo?.especialidades && (
                  <p style={{ margin: '6px 0', fontSize: '14px', color: '#3E2445' }}>
                    <strong>✂️ Especialidades:</strong> {costureiraInfo.especialidades}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px', fontSize: '14px', color: '#555' }}>
                  <div>
                    <strong>📞 Telefone / WhatsApp:</strong> {costureiraInfo?.telefone || 'Não informado'}
                  </div>
                  <div>
                    <strong>📍 Endereço / Ateliê:</strong> {costureiraInfo?.endereco || 'Não informado'}
                  </div>
                </div>
              </div>
            </div>

            {costureiraInfo?.bio && (
              <div style={{ marginTop: '18px', paddingTop: '15px', borderTop: '1px solid #f0f0f0', fontSize: '14px', color: '#444', lineHeight: '1.5' }}>
                <strong style={{ color: '#3E2445', display: 'block', marginBottom: '4px' }}>Sobre o trabalho:</strong>
                {costureiraInfo.bio}
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* 2. TABELA DE PREÇOS REFERENCIAIS (EXIBE APENAS SE HOUVER ITENS)    */}
          {/* ================================================================= */}
          {precos.length > 0 && (
            <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', marginBottom: '25px' }}>
              <h3 style={{ color: '#3E2445', marginTop: 0, marginBottom: '6px', fontSize: '18px' }}>
                Tabela de Preços Referenciais
              </h3>
              <p style={{ color: '#666', fontSize: '13px', marginTop: 0, marginBottom: '15px' }}>
                Valores base estimados informados pela costureira.
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#3E2445', color: '#fff', textAlign: 'left' }}>
                    <th style={{ padding: '9px 12px' }}>Serviço</th>
                    <th style={{ padding: '9px 12px' }}>Categoria</th>
                    <th style={{ padding: '9px 12px' }}>Valor Base</th>
                  </tr>
                </thead>
                <tbody>
                  {precos.map((item, index) => (
                    <tr key={item.id_preco || item.id || index} style={{ borderBottom: '1px solid #eee', background: index % 2 === 0 ? '#FAF7F5' : '#fff' }}>
                      <td style={{ padding: '9px 12px' }}>{item.servico}</td>
                      <td style={{ padding: '9px 12px' }}>{item.categoria}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 'bold', color: '#2e7d32' }}>
                        R$ {Number(item.valor || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. AVALIAÇÕES E DEPOIMENTOS                                       */}
          {/* ================================================================= */}
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
              <h3 style={{ color: '#3E2445', margin: 0, fontSize: '18px' }}>Avaliações de Clientes</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FAF6FA', padding: '6px 12px', borderRadius: '8px', border: '1px solid #EADCEB' }}>
                <span style={{ fontSize: '20px', color: '#FFB400', fontWeight: 'bold' }}>
                  {reputacao.media ? Number(reputacao.media).toFixed(1) : '0.0'}
                </span>
                <span style={{ fontSize: '17px', color: '#FFB400' }}>
                  {renderEstrelas(reputacao.media)}
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  ({reputacao.totalAvaliacoes || 0} {reputacao.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>
            </div>

            {!reputacao.depoimentos || reputacao.depoimentos.length === 0 ? (
              <p style={{ color: '#888', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                Esta costureira ainda não recebeu avaliações.
              </p>
            ) : (
              <div>
                {reputacao.depoimentos.map((dep, index) => (
                  <div key={dep.id || dep.id_avaliacao || index} style={{ padding: '12px 0', borderBottom: index < reputacao.depoimentos.length - 1 ? '1px dashed #eee' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#3E2445' }}>{dep.clienteNome || dep.nome_cliente || 'Cliente'}</strong>
                      <span style={{ color: '#FFB400', fontSize: '14px' }}>{renderEstrelas(dep.nota)}</span>
                    </div>
                    {dep.comentario && <p style={{ margin: '5px 0', fontSize: '13px', color: '#555' }}>"{dep.comentario}"</p>}
                    {(dep.data || dep.data_avaliacao) && (
                      <span style={{ fontSize: '11px', color: '#aaa' }}>
                        {new Date(dep.data || dep.data_avaliacao).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* 4. PORTFÓLIO DE TRABALHOS (ÚLTIMA SEÇÃO)                              */}
      {/* ===================================================================== */}
      <div style={{ background: '#fff', padding: exibirPerfilCompleto ? '25px' : '0', borderRadius: '12px', boxShadow: exibirPerfilCompleto ? '0 4px 16px rgba(62, 36, 69, 0.12)' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ color: '#3E2445', margin: '0 0 4px 0', fontSize: '18px' }}>
              Portfólio de Trabalhos
            </h3>
            <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
              {modoEdicao
                ? 'Gerencie as fotos dos seus trabalhos para atrair mais clientes.'
                : 'Galeria de trabalhos e peças já confeccionadas.'}
            </p>
          </div>

          {modoEdicao && (
            <button
              type="button"
              onClick={() => setMostrarModalAdd(true)}
              style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              + Adicionar Foto
            </button>
          )}
        </div>

        {!carregando && itens.length === 0 ? (
          <div style={{ padding: '25px', textAlign: 'center', color: '#888', background: '#FAF9FA', borderRadius: '8px' }}>
            <p style={{ fontSize: '14px', fontStyle: 'italic', margin: 0 }}>
              Nenhum trabalho publicado neste portfólio ainda.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '18px' }}>
            {itens.map((item) => {
              const idFoto = item.id || item.id_midia || item.id_portfolio;
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
                      type="button"
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
        )}
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