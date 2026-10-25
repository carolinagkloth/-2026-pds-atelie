import React, { useState, useEffect } from 'react';

function FeedPedidos({ usuario, usuarioLogado, onNavigate, onDemonstrarInteresse }) {
  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const usuarioAtual = usuario || usuarioLogado || usuarioSalvo;
  const isCostureira = (usuarioAtual?.tipo_usuario || usuarioAtual?.tipoUsuario || '').toString().toLowerCase() === 'costureira';

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [filtroServico, setFiltroServico] = useState('Todos');
  const [buscaLocalizacao, setBuscaLocalizacao] = useState('');

  useEffect(() => {
    fetch('/api/pedidos')
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao carregar o mural de pedidos.');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPedidos(data);
        } else {
          setPedidos([]);
        }
      })
      .catch((err) => {
        setErro(err.message);
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('usuarioAtelie');
    if (onNavigate) {
      onNavigate('inicio');
    }
  };

  const extrairInformacoes = (texto, localizacaoPadrao) => {
    if (!texto) return { tipo: 'Ajuste / Conserto', localizacao: localizacaoPadrao || 'Não informada', descricao: '' };

    let tipo = 'Ajuste / Conserto';
    let localizacao = localizacaoPadrao || 'Não informada';
    let descricao = texto;

    if (texto.includes('Localização:')) {
      const partes = texto.split('Localização:');
      let tipoExtraido = partes[0].replace('[', '').replace(']', '').replace('-', '').trim();

      if (tipoExtraido) {
        tipo = tipoExtraido;
      }

      const resto = partes[1].trim();
      const quebra = resto.indexOf('\n');

      if (quebra !== -1) {
        localizacao = resto.substring(0, quebra).trim();
        descricao = resto.substring(quebra).trim();
      } else {
        localizacao = resto;
        descricao = resto;
      }
    }

    return { tipo, localizacao, descricao };
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return '-';
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR');
  };

  const handleInteresse = (pedido) => {
    if (onDemonstrarInteresse) {
      onDemonstrarInteresse(pedido);
    } else if (onNavigate) {
      onNavigate('chat', pedido);
    }
  };

  const listaPedidos = Array.isArray(pedidos) ? pedidos : [];
  const pedidosFiltrados = listaPedidos.filter((pedido) => {
    const info = extrairInformacoes(pedido.descricao, pedido.localizacao);
    const statusAberto = pedido.status === 'Aberto' || pedido.status === 'Disponível' || !pedido.status;
    
    const atendeServico = filtroServico === 'Todos' || info.tipo.toLowerCase().includes(filtroServico.toLowerCase());
    const atendeLocal = (info.localizacao || '').toLowerCase().includes((buscaLocalizacao || '').toLowerCase());

    return statusAberto && atendeServico && atendeLocal;
  });

  return (
    <div style={{ maxWidth: '950px', margin: '30px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: '#3E2445', margin: 0, fontSize: '22px' }}>
            Mural de Pedidos Disponíveis
          </h2>
          {usuarioAtual?.nome && (
            <span style={{ fontSize: '13px', color: '#666', marginTop: '4px', display: 'block' }}>
              Olá, <strong>{usuarioAtual.nome}</strong> (Costureira)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate && onNavigate('perfil')}
            style={{ padding: '9px 16px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Ver Perfil
          </button>

          <button
            onClick={handleLogout}
            style={{ padding: '9px 16px', background: 'transparent', color: '#C62828', border: '1px solid #C62828', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Sair
          </button>
        </div>
      </div>

      <div style={{ background: '#F9F6F9', padding: '16px', borderRadius: '8px', border: '1px solid #EADFEA', marginBottom: '25px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#3E2445', display: 'block', marginBottom: '6px' }}>Filtrar por Serviço:</label>
          <select 
            value={filtroServico} 
            onChange={(e) => setFiltroServico(e.target.value)} 
            style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', fontSize: '14px', background: '#fff' }}
          >
            <option value="Todos">Todos os Serviços</option>
            <option value="Ajuste">Ajuste / Conserto</option>
            <option value="Confecção sob Medida">Confecção sob Medida</option>
            <option value="Customização">Customização / Bordado</option>
            <option value="Vestido de Festa">Vestido de Festa</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#3E2445', display: 'block', marginBottom: '6px' }}>Buscar por Bairro / Cidade:</label>
          <input
            type="text"
            placeholder="Ex: Centro, Ponta Grossa..."
            value={buscaLocalizacao}
            onChange={(e) => setBuscaLocalizacao(e.target.value)}
            style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none', fontSize: '14px', background: '#fff' }}
          />
        </div>
      </div>

      {carregando && <p style={{ textAlign: 'center', color: '#666' }}>Carregando pedidos do mural...</p>}
      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{erro}</div>}

      {!carregando && pedidosFiltrados.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fdfdfd', border: '2px dashed #e0d0e0', borderRadius: '8px' }}>
          <h3 style={{ color: '#3E2445', margin: '0 0 8px 0', fontSize: '16px' }}>Nenhum pedido encontrado com os filtros selecionados.</h3>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Tente alterar os termos de busca ou aguarde novas publicações dos clientes.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {pedidosFiltrados.map((pedido) => {
            const info = extrairInformacoes(pedido.descricao, pedido.localizacao);

            return (
              <div 
                key={pedido.id} 
                style={{ 
                  background: '#fff', 
                  border: '1px solid #E0E0E0', 
                  borderRadius: '10px', 
                  padding: '20px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justify: 'space-between' 
                }}
              >
                <div>
                  {pedido.fotoReferencia && (
                    <div style={{ width: '100%', height: '180px', overflow: 'hidden', borderRadius: '6px', marginBottom: '15px', background: '#fafafa', border: '1px solid #eee' }}>
                      <img
                        src={pedido.fotoReferencia}
                        alt="Referência da peça"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ background: '#E8D8E8', color: '#3E2445', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      {info.tipo}
                    </span>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      {formatarData(pedido.dataPublicacao)}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 10px 0', color: '#3E2445', fontSize: '17px', fontWeight: 'bold' }}>
                    Solicitação de {pedido.clienteNome || 'Cliente'}
                  </h3>

                  <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.5', marginBottom: '15px', whiteSpace: 'pre-line' }}>
                    {info.descricao}
                  </p>

                  <div style={{ fontSize: '13px', color: '#555', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '6px', background: '#FBF9FB', padding: '10px', borderRadius: '6px' }}>
                    <div><strong>Localização:</strong> {info.localizacao}</div>
                    <div><strong>Prazo desejado:</strong> {formatarData(pedido.prazoDesejado)}</div>
                  </div>
                </div>

                {isCostureira ? (
                  <button
                    onClick={() => handleInteresse(pedido)}
                    style={{ width: '100%', padding: '11px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                  >
                    Demonstrar interesse e abrir chat de negociação
                  </button>
                ) : (
                  <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', textAlign: 'center' }}>
                    Apenas contas de Costureira podem aceitar solicitações.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FeedPedidos;