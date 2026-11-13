import React, { useState, useEffect } from 'react';
import AvatarPerfil from './AvatarPerfil';

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
  const [filtroPrazo, setFiltroPrazo] = useState(''); // Formato YYYY-MM

  const normalizarTexto = (texto) => {
    return texto
      ? texto
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
      : '';
  };

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

  // Extrai Tipo de Serviço (sem colchetes), Localização e Descrição limpa
  const extrairInformacoes = (texto, localizacaoPadrao) => {
    if (!texto) {
      return {
        tipo: 'Pedido de Costura',
        localizacao: localizacaoPadrao || 'Não informada',
        descricao: ''
      };
    }

    let tipo = 'Pedido de Costura';
    let localizacao = localizacaoPadrao || 'Não informada';
    let descricao = texto;

    if (texto.includes('Localização:')) {
      const partes = texto.split('Localização:');

      const tipoExtraido = partes[0]
        .replace(/[\[\]]/g, '')
        .replace(/\s*-\s*$/, '')
        .trim();

      if (tipoExtraido) {
        tipo = tipoExtraido;
      }

      const resto = partes[1].trim();
      const quebraDupla = resto.indexOf('\n\n');

      if (quebraDupla !== -1) {
        localizacao = resto.substring(0, quebraDupla).trim();
        descricao = resto.substring(quebraDupla).trim();
      } else {
        const primeiraLinha = resto.split('\n')[0];
        localizacao = primeiraLinha.trim();
        descricao = resto.substring(primeiraLinha.length).trim();
      }
    } else {
      const matchColchetes = texto.match(/^\[([^\]]+)\]\s*(?:-?\s*)([\s\S]*)$/);
      if (matchColchetes) {
        tipo = matchColchetes[1].trim();
        descricao = matchColchetes[2].trim();
      }
    }

    return { tipo, localizacao, descricao };
  };

  // Formata data sem deslocamento de fuso horário UTC
  const formatarData = (dataIso) => {
    if (!dataIso) return '-';
    if (typeof dataIso === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dataIso)) {
      const [ano, mes, dia] = dataIso.split('T')[0].split('-');
      return `${dia}/${mes}/${ano}`;
    }
    const data = new Date(dataIso);
    return isNaN(data.getTime()) ? '-' : data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  // Extrai "YYYY-MM" do prazo do pedido para comparar com o filtro de Mês/Ano
  const extrairMesAno = (dataIso) => {
    if (!dataIso) return '';
    if (typeof dataIso === 'string' && /^\d{4}-\d{2}/.test(dataIso)) {
      return dataIso.split('T')[0].substring(0, 7);
    }
    const d = new Date(dataIso);
    if (isNaN(d.getTime())) return '';
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
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
    const statusAtual = pedido.status || pedido.status_pedido;
    const statusAberto = statusAtual === 'Aberto' || statusAtual === 'Disponível' || !statusAtual;
    
    const tipoNorm = normalizarTexto(info.tipo);
    const filtroServicoNorm = normalizarTexto(filtroServico);
    const atendeServico = filtroServico === 'Todos' || tipoNorm.includes(filtroServicoNorm);

    const localNorm = normalizarTexto(info.localizacao);
    const buscaLocalNorm = normalizarTexto(buscaLocalizacao);
    const atendeLocal = localNorm.includes(buscaLocalNorm);

    const prazoPedido = pedido.prazoDesejado || pedido.prazo_desejado;
    const mesAnoPedido = extrairMesAno(prazoPedido);
    const atendePrazo = !filtroPrazo || mesAnoPedido === filtroPrazo;

    return statusAberto && atendeServico && atendeLocal && atendePrazo;
  });

  return (
    <div style={{ maxWidth: '950px', margin: '30px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* Cabeçalho com Botão de Conversas e Avatar */}
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

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate && onNavigate('meusChats')}
            style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Minhas Conversas
          </button>

          <AvatarPerfil
            usuario={usuarioAtual}
            onClick={() => onNavigate && onNavigate('perfil')}
          />
        </div>
      </div>

      {/* Barra de Filtros: Serviço, Localização e Prazo (Mês/Ano) */}
      <div style={{ background: '#F9F6F9', padding: '16px', borderRadius: '8px', border: '1px solid #EADFEA', marginBottom: '25px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#3E2445', display: 'block', marginBottom: '6px' }}>Filtrar por Serviço:</label>
          <select 
            value={filtroServico} 
            onChange={(e) => setFiltroServico(e.target.value)} 
            style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', fontSize: '14px', background: '#fff' }}
          >
            <option value="Todos">Todos os Serviços</option>
            <option value="Ajuste / Conserto">Ajuste / Conserto</option>
            <option value="Confecção sob Medida">Confecção sob Medida</option>
            <option value="Customização / Bordado">Customização / Bordado</option>
            <option value="Vestido de Festa">Vestido de Festa</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#3E2445', display: 'block', marginBottom: '6px' }}>Buscar por Bairro / Cidade:</label>
          <input
            type="text"
            placeholder="Ex: Órfãs, Centro, Ponta Grossa..."
            value={buscaLocalizacao}
            onChange={(e) => setBuscaLocalizacao(e.target.value)}
            style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none', fontSize: '14px', background: '#fff' }}
          />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#3E2445', display: 'block', marginBottom: '6px' }}>Prazo Desejado (Mês/Ano):</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="month"
              value={filtroPrazo}
              onChange={(e) => setFiltroPrazo(e.target.value)}
              style={{ flex: 1, padding: '8px 9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none', fontSize: '14px', background: '#fff', color: '#333' }}
            />
            {filtroPrazo && (
              <button
                type="button"
                onClick={() => setFiltroPrazo('')}
                title="Limpar filtro de mês/ano"
                style={{ padding: '9px 11px', background: '#EADCEB', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                ✕
              </button>
            )}
          </div>
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
            const prazoPedido = pedido.prazoDesejado || pedido.prazo_desejado;

            return (
              <div 
                key={pedido.id || pedido.id_pedido} 
                style={{ 
                  background: '#fff', 
                  border: '1px solid #E0E0E0', 
                  borderRadius: '10px', 
                  padding: '20px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between' 
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
                      {formatarData(pedido.dataPublicacao || pedido.data_publicacao)}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 12px 0', color: '#3E2445', fontSize: '17px', fontWeight: 'bold' }}>
                    Solicitação de {pedido.clienteNome || pedido.cliente_nome || 'Cliente'}
                  </h3>

                  <div style={{ fontSize: '13px', color: '#555', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '6px', background: '#FBF9FB', padding: '10px', borderRadius: '6px' }}>
                    <div><strong>Localização:</strong> {info.localizacao}</div>
                    {info.descricao && (
                      <div style={{ whiteSpace: 'pre-line' }}><strong>Descrição:</strong> {info.descricao}</div>
                    )}
                    <div><strong>Prazo desejado:</strong> {formatarData(prazoPedido)}</div>
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