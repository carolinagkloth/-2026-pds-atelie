import React, { useState, useEffect } from 'react';

function Chat({ pedido, usuario, onNavigate }) {
  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const user = usuario && Object.keys(usuario).length > 0 ? usuario : usuarioSalvo;
  const idUsuario = user?.id_usuario || user?.id;
  const nomeUsuario = user?.nome || 'Usuário';
  const isCostureira = (user?.tipo_usuario || user?.tipoUsuario || '').toString().toLowerCase() === 'costureira';

  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [mostrarModalProposta, setMostrarModalProposta] = useState(false);
  const [mostrarModalMedidas, setMostrarModalMedidas] = useState(false);

  const [orcamentoAtual, setOrcamentoAtual] = useState({
    total: 0,
    entrada: 0,
    prazo: '',
    status: 'Pendente',
    descricao: ''
  });

  const [medidas, setMedidas] = useState({
    busto: '',
    cintura: '',
    quadril: '',
    altura: '',
    comprimento: ''
  });

  const [propostaForm, setPropostaForm] = useState({
    descricao: '',
    valorTotal: '',
    valorEntrada: '',
    previsaoEntrega: ''
  });

  const idPedido = pedido?.id || pedido?.id_pedido;

  useEffect(() => {
    if (idPedido) {
      carregarMensagens();
    }
  }, [idPedido]);

  const carregarMensagens = () => {
    fetch(`/api/mensagens-chat/${idPedido}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMensagens(data);

          const propostaExistente = [...data].reverse().find(
            (m) => m.tipo_mensagem === 'proposta' || (m.conteudo && m.conteudo.includes('Proposta de Orçamento:'))
          );

          if (propostaExistente) {
            let dados = propostaExistente.dados_proposta || {};
            if (typeof dados === 'string') {
              try { dados = JSON.parse(dados); } catch { dados = {}; }
            }

            setOrcamentoAtual({
              total: dados.valorTotal || extrairValorTexto(propostaExistente.conteudo, 'Valor Total: R$') || 0,
              entrada: dados.valorEntrada || extrairValorTexto(propostaExistente.conteudo, 'Entrada (Sinal): R$') || 0,
              prazo: dados.previsaoEntrega || pedido?.prazoDesejado || '',
              status: 'Aguardando Aprovação',
              descricao: dados.descricaoServico || ''
            });
          }
        }
      })
      .catch(() => {});
  };

  const extrairValorTexto = (texto, chave) => {
    if (!texto || !texto.includes(chave)) return 0;
    try {
      const parte = texto.split(chave)[1];
      const numero = parte.split('\n')[0].trim();
      return parseFloat(numero) || 0;
    } catch {
      return 0;
    }
  };

  const extrairDescricaoLimpa = (texto) => {
    if (!texto) return '';
    if (texto.includes('Localização:')) {
      const partes = texto.split('Localização:');
      const resto = partes[1].trim();
      const quebra = resto.indexOf('\n\n');
      if (quebra !== -1) {
        return resto.substring(quebra).trim();
      }
      const primeiraLinha = resto.split('\n')[0];
      return resto.substring(primeiraLinha.length).trim();
    }
    return texto;
  };

  const handleAbrirModalProposta = () => {
    const descricaoLimpa = extrairDescricaoLimpa(pedido?.descricao);
    setPropostaForm({
      descricao: orcamentoAtual.descricao || descricaoLimpa || pedido?.descricao || '',
      valorTotal: orcamentoAtual.total ? Number(orcamentoAtual.total).toFixed(2) : '',
      valorEntrada: orcamentoAtual.entrada ? Number(orcamentoAtual.entrada).toFixed(2) : '',
      previsaoEntrega: orcamentoAtual.prazo ? new Date(orcamentoAtual.prazo).toISOString().split('T')[0] : (pedido?.prazoDesejado ? new Date(pedido.prazoDesejado).toISOString().split('T')[0] : '')
    });
    setMostrarModalProposta(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioAtelie');
    if (onNavigate) onNavigate('inicio');
  };

  const handleVoltarPedidos = () => {
    if (onNavigate) {
      onNavigate(isCostureira ? 'feedPedidos' : 'meusPedidos');
    }
  };

  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    try {
      const response = await fetch('/api/mensagens-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_remetente: Number(idUsuario),
          conteudo: novaMensagem.trim(),
          tipo_mensagem: 'texto'
        })
      });

      if (response.ok) {
        setNovaMensagem('');
        carregarMensagens();
      } else {
        const data = await response.json();
        alert(data.erro || 'Erro ao enviar mensagem.');
      }
    } catch (err) {
      alert(`Erro de conexão: ${err.message}`);
    }
  };

  const handleValorChange = (campo, valorBruto) => {
    const apenasNumeros = valorBruto.replace(/\D/g, '');
    if (!apenasNumeros) {
      setPropostaForm((prev) => ({ ...prev, [campo]: '' }));
      return;
    }
    const valorDecimal = (parseFloat(apenasNumeros) / 100).toFixed(2);
    setPropostaForm((prev) => ({ ...prev, [campo]: valorDecimal }));
  };

  const handleEnviarProposta = async (e) => {
    e.preventDefault();

    if (!idPedido || !idUsuario) {
      alert('Erro: ID do pedido ou do usuário não identificado.');
      return;
    }

    const total = parseFloat(propostaForm.valorTotal);
    if (isNaN(total) || total <= 0) {
      alert('Informe um valor total válido para a proposta.');
      return;
    }

    const entrada = propostaForm.valorEntrada ? parseFloat(propostaForm.valorEntrada) : 0;

    const textoFormatado = `Proposta de Orçamento:\nServiço: ${propostaForm.descricao}\nValor Total: R$ ${total.toFixed(2)}${entrada > 0 ? `\nEntrada (Sinal): R$ ${entrada.toFixed(2)}` : ''}\nPrevisão de Entrega: ${propostaForm.previsaoEntrega ? new Date(propostaForm.previsaoEntrega).toLocaleDateString('pt-BR') : 'A combinar'}`;

    const payload = {
      id_pedido: Number(idPedido),
      id_remetente: Number(idUsuario),
      conteudo: textoFormatado,
      tipo_mensagem: 'proposta',
      valor_entrada: entrada,
      valor_proposta: total,
      dados_proposta: {
        descricaoServico: propostaForm.descricao,
        valorTotal: total,
        valorEntrada: entrada,
        previsaoEntrega: propostaForm.previsaoEntrega
      }
    };

    try {
      const response = await fetch('/api/mensagens-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao registrar a proposta no servidor.');
      }

      setOrcamentoAtual({
        total: total,
        entrada: entrada,
        prazo: propostaForm.previsaoEntrega,
        status: 'Aguardando Aprovação',
        descricao: propostaForm.descricao
      });

      setMostrarModalProposta(false);
      carregarMensagens();
      alert('Proposta enviada com sucesso!');
    } catch (err) {
      alert(`Erro ao enviar proposta: ${err.message}`);
    }
  };

  const handleAceitarProposta = async (dadosProposta) => {
    try {
      const response = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: idPedido,
          id_costureira: pedido.costureiraId || idUsuario,
          valor_total: dadosProposta.valorTotal || orcamentoAtual.total,
          valor_entrada: dadosProposta.valorEntrada || orcamentoAtual.entrada,
          previsao_entrega: dadosProposta.previsaoEntrega || orcamentoAtual.prazo
        })
      });

      if (response.ok) {
        alert('Orçamento aprovado! O pedido foi atualizado.');
        setOrcamentoAtual((prev) => ({ ...prev, status: 'Em Produção' }));
        if (onNavigate) onNavigate('meusPedidos');
      } else {
        const data = await response.json();
        alert(data.erro || 'Erro ao aprovar o orçamento.');
      }
    } catch (err) {
      alert(`Erro ao aprovar orçamento: ${err.message}`);
    }
  };

  const handleBaixarTXT = () => {
    const conteudoTXT = `FICHA DE MEDIDAS E ORÇAMENTO\nPedido: #${idPedido}\nCliente: ${pedido?.clienteNome || 'Cliente'}\nData: ${new Date().toLocaleDateString('pt-BR')}\n\nMEDIDAS:\n- Busto: ${medidas.busto || 'Não informado'}\n- Cintura: ${medidas.cintura || 'Não informado'}\n- Quadril: ${medidas.quadril || 'Não informado'}\n- Altura: ${medidas.altura || 'Não informado'}\n- Comprimento: ${medidas.comprimento || 'Não informado'}\n\nORÇAMENTO:\n- Serviço: ${orcamentoAtual.descricao || extrairDescricaoLimpa(pedido?.descricao) || 'Não informado'}\n- Valor Total: R$ ${orcamentoAtual.total ? Number(orcamentoAtual.total).toFixed(2) : '0.00'}\n- Valor de Entrada: R$ ${orcamentoAtual.entrada ? Number(orcamentoAtual.entrada).toFixed(2) : '0.00'}\n- Status: ${orcamentoAtual.status}`;

    const blob = new Blob([conteudoTXT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ficha_Medidas_Pedido_${idPedido}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGerarPDF = () => {
    const janelaImpressao = window.open('', '_blank', 'width=800,height=900');
    
    const htmlPDF = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orçamento e Ficha de Medidas - Ateliê Entre Linhas</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 2px solid #3E2445; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .title { color: #3E2445; font-size: 24px; font-weight: bold; margin: 0; }
          .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
          .section { margin-bottom: 25px; background: #FAF7FA; padding: 18px; border-radius: 8px; border: 1px solid #EADCEB; }
          .section-title { font-size: 16px; font-weight: bold; color: #3E2445; border-bottom: 1px solid #D8BFD8; padding-bottom: 6px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
          th { background: #EADCEB; color: #3E2445; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Ateliê Entre Linhas</h1>
            <div class="subtitle">Documento de Orçamento e Ficha Técnica</div>
          </div>
          <div style="text-align: right; font-size: 13px; color: #555;">
            <div><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
            <div><strong>Pedido:</strong> #${idPedido}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Detalhamento do Orçamento</div>
          <div style="margin-bottom: 10px;"><strong>Descrição do Serviço:</strong> ${orcamentoAtual.descricao || extrairDescricaoLimpa(pedido?.descricao) || 'Não informada'}</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Valor Total do Serviço</td>
                <td><strong>R$ ${orcamentoAtual.total ? Number(orcamentoAtual.total).toFixed(2) : '0.00'}</strong></td>
              </tr>
              ${orcamentoAtual.entrada > 0 ? `
              <tr>
                <td>Valor de Entrada (Sinal)</td>
                <td>R$ ${Number(orcamentoAtual.entrada).toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr>
                <td>Previsão de Entrega</td>
                <td>${orcamentoAtual.prazo ? new Date(orcamentoAtual.prazo).toLocaleDateString('pt-BR') : 'A combinar'}</td>
              </tr>
              <tr>
                <td>Status do Serviço</td>
                <td>${orcamentoAtual.status}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Ficha de Medidas do Cliente</div>
          <table>
            <thead>
              <tr>
                <th>Medida</th>
                <th>Valor (cm)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Busto</td><td>${medidas.busto || 'Não informado'}</td></tr>
              <tr><td>Cintura</td><td>${medidas.cintura || 'Não informado'}</td></tr>
              <tr><td>Quadril</td><td>${medidas.quadril || 'Não informado'}</td></tr>
              <tr><td>Altura</td><td>${medidas.altura || 'Não informado'}</td></tr>
              <tr><td>Comprimento da Peça</td><td>${medidas.comprimento || 'Não informado'}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="footer">
          Ateliê Entre Linhas - Plataforma de Confecção e Ajustes
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    janelaImpressao.document.write(htmlPDF);
    janelaImpressao.document.close();
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '20px 25px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: '#3E2445', margin: 0, fontSize: '22px' }}>Chat de Negociação</h2>
          <span style={{ fontSize: '13px', color: '#666', marginTop: '4px', display: 'block' }}>
            Usuário: <strong>{nomeUsuario}</strong> ({isCostureira ? 'Costureira' : 'Cliente'})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate && onNavigate('meusChats')}
            style={{ padding: '9px 16px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Conversas
          </button>
          
          <button
            onClick={handleVoltarPedidos}
            style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Ver Pedidos
          </button>

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

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        
        {/* Janela do Chat */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', display: 'flex', flexDirection: 'column', height: '620px', overflow: 'hidden' }}>
          
          <div style={{ background: '#3E2445', color: '#fff', padding: '15px 20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Atendimento Direto</h3>
            <span style={{ fontSize: '12px', opacity: 0.85 }}>Conectado como: {nomeUsuario}</span>
          </div>

          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#FAF7FA', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mensagens.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', marginTop: 'auto', marginBottom: 'auto', fontSize: '14px' }}>
                Nenhuma mensagem trocada ainda. Envie uma mensagem para iniciar a negociação.
              </div>
            ) : (
              mensagens.map((msg) => {
                const ehMinha = Number(msg.id_remetente) === Number(idUsuario);
                const ehProposta = msg.tipo_mensagem === 'proposta' || (msg.conteudo && msg.conteudo.includes('Proposta de Orçamento:'));

                return (
                  <div key={msg.id_mensagem || msg.id} style={{ display: 'flex', justifyContent: ehMinha ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', background: ehMinha ? '#3E2445' : '#fff', color: ehMinha ? '#fff' : '#333', border: ehMinha ? 'none' : '1px solid #E0D0E0', padding: '12px 16px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '11px', color: ehMinha ? '#EADCEB' : '#777', marginBottom: '4px', fontWeight: 'bold' }}>
                        {msg.remetente_nome || (ehMinha ? 'Você' : 'Interlocutor')}
                      </div>
                      <div style={{ fontSize: '14px', whiteSpace: 'pre-line', lineHeight: '1.4' }}>{msg.conteudo}</div>

                      {!isCostureira && ehProposta && (
                        <button
                          onClick={() => handleAceitarProposta(msg.dados_proposta || {})}
                          style={{ marginTop: '12px', width: '100%', padding: '9px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                        >
                          Aprovar Orçamento e Iniciar Serviço
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleEnviarMensagem} style={{ padding: '15px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              style={{ flex: 1, padding: '11px 14px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', fontSize: '14px' }}
            />
            <button
              type="submit"
              style={{ padding: '11px 20px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
            >
              Enviar
            </button>
          </form>

        </div>

        {/* Painel Lateral Único */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Status Financeiro */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#3E2445', fontSize: '17px', fontWeight: 'bold' }}>Status Financeiro</h3>
            
            <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: '8px', padding: '12px', marginBottom: '15px' }}>
              <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Status do Serviço:</span>
              <strong style={{ color: '#E65100', fontSize: '14px' }}>{orcamentoAtual.status}</strong>
            </div>

            <div style={{ fontSize: '14px', color: '#444', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              <div><strong>Total:</strong> R$ {orcamentoAtual.total ? Number(orcamentoAtual.total).toFixed(2) : '0.00'}</div>
              {orcamentoAtual.entrada > 0 && (
                <div><strong>Entrada:</strong> R$ {Number(orcamentoAtual.entrada).toFixed(2)}</div>
              )}
              <div><strong>Prazo:</strong> {orcamentoAtual.prazo ? new Date(orcamentoAtual.prazo).toLocaleDateString('pt-BR') : 'A combinar'}</div>
            </div>

            {isCostureira && (
              <button
                onClick={handleAbrirModalProposta}
                style={{ width: '100%', padding: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                {orcamentoAtual.total > 0 ? 'Editar Orçamento' : '+ Incluir Orçamento / Proposta'}
              </button>
            )}
          </div>

          {/* Card 2: Ficha de Medidas */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#3E2445', fontSize: '17px', fontWeight: 'bold' }}>Ficha de Medidas</h3>
              <button
                onClick={() => setMostrarModalMedidas(true)}
                style={{ background: 'none', border: 'none', color: '#3E2445', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Editar
              </button>
            </div>

            <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: 0, fontSize: '13px', color: '#555', lineHeight: '1.8' }}>
              <li>Busto: {medidas.busto || 'Não informado'}</li>
              <li>Cintura: {medidas.cintura || 'Não informado'}</li>
              <li>Quadril: {medidas.quadril || 'Não informado'}</li>
              <li>Altura: {medidas.altura || 'Não informado'}</li>
              <li>Comprimento: {medidas.comprimento || 'Não informado'}</li>
            </ul>
          </div>

          {/* Card 3: Ações de Exportação (Apenas 1 botão PDF e 1 botão TXT) */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handleGerarPDF}
              style={{ width: '100%', padding: '11px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              Exportar PDF Completo
            </button>
            <button
              onClick={handleBaixarTXT}
              style={{ width: '100%', padding: '10px', background: '#fff', color: '#3E2445', border: '1px solid #ccc', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              Baixar Texto (.TXT)
            </button>
          </div>

        </div>

      </div>

      {/* Modal de Orçamento */}
      {mostrarModalProposta && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '450px', maxWidth: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#3E2445', fontSize: '18px' }}>Elaborar Proposta de Orçamento</h3>
            
            <form onSubmit={handleEnviarProposta}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Descrição do Serviço</label>
                <textarea
                  rows="3"
                  value={propostaForm.descricao}
                  onChange={(e) => setPropostaForm({ ...propostaForm, descricao: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Valor Total (R$) *</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '6px', padding: '0 10px', background: '#fff' }}>
                  <span style={{ color: '#555', fontWeight: 'bold', marginRight: '6px' }}>R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0.00"
                    value={propostaForm.valorTotal}
                    onChange={(e) => handleValorChange('valorTotal', e.target.value)}
                    style={{ width: '100%', padding: '9px 0', border: 'none', outline: 'none', background: 'transparent', fontSize: '14px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Valor de Entrada / Sinal (Opcional)</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '6px', padding: '0 10px', background: '#fff' }}>
                  <span style={{ color: '#555', fontWeight: 'bold', marginRight: '6px' }}>R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0.00"
                    value={propostaForm.valorEntrada}
                    onChange={(e) => handleValorChange('valorEntrada', e.target.value)}
                    style={{ width: '100%', padding: '9px 0', border: 'none', outline: 'none', background: 'transparent', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Previsão de Entrega</label>
                <input
                  type="date"
                  value={propostaForm.previsaoEntrega}
                  onChange={(e) => setPropostaForm({ ...propostaForm, previsaoEntrega: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalProposta(false)}
                  style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Enviar Proposta
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal de Medidas */}
      {mostrarModalMedidas && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#3E2445', fontSize: '18px' }}>Editar Ficha de Medidas</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Busto (cm)</label>
                <input
                  type="text"
                  value={medidas.busto}
                  onChange={(e) => setMedidas({ ...medidas, busto: e.target.value })}
                  placeholder="Ex: 90 cm"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Cintura (cm)</label>
                <input
                  type="text"
                  value={medidas.cintura}
                  onChange={(e) => setMedidas({ ...medidas, cintura: e.target.value })}
                  placeholder="Ex: 72 cm"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Quadril (cm)</label>
                <input
                  type="text"
                  value={medidas.quadril}
                  onChange={(e) => setMedidas({ ...medidas, quadril: e.target.value })}
                  placeholder="Ex: 98 cm"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Altura (cm)</label>
                <input
                  type="text"
                  value={medidas.altura}
                  onChange={(e) => setMedidas({ ...medidas, altura: e.target.value })}
                  placeholder="Ex: 165 cm"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Comprimento (cm)</label>
                <input
                  type="text"
                  value={medidas.comprimento}
                  onChange={(e) => setMedidas({ ...medidas, comprimento: e.target.value })}
                  placeholder="Ex: 110 cm"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setMostrarModalMedidas(false)}
                style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Salvar Medidas
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Chat;