import React, { useState } from 'react';

function Chat({ usuario, usuarioLogado, onNavigate, pedido }) {
  // Leitura segura do usuário logado (Props ou localStorage)
  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const user = usuario || usuarioLogado || usuarioSalvo;
  
  // Identificação flexível e insensível a maiúsculas/minúsculas do tipo de usuário
  const tipoPerfilRaw = (user?.tipo_usuario || user?.tipoUsuario || user?.usuario?.tipo_usuario || 'Cliente').toString();
  const isCostureira = tipoPerfilRaw.toLowerCase() === 'costureira';
  const papelAtual = isCostureira ? 'Costureira' : 'Cliente';
  const nomeUsuario = user?.nome || user?.usuario?.nome || papelAtual;

  // Ficha de medidas editável por ambas as partes
  const [medidas, setMedidas] = useState({
    clienteNome: pedido?.clienteNome || (isCostureira ? 'Cliente' : nomeUsuario),
    busto: '',
    cintura: '',
    quadril: '',
    altura: '',
    comprimentoDesejado: ''
  });

  const [editandoMedidas, setEditandoMedidas] = useState(false);

  // Histórico de mensagens
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');

  // Estados de orçamento e pagamento
  const [mostrarModalOrcamento, setMostrarModalOrcamento] = useState(false);
  const [orcamento, setOrcamento] = useState(null);
  const [statusPagamento, setStatusPagamento] = useState('Sem Orçamento');

  // Estado dos campos do modal de orçamento
  const [formOrcamento, setFormOrcamento] = useState({
    descricao: pedido?.descricao ? `Serviço: ${pedido.descricao}` : '',
    valor: '',
    prazo: pedido?.prazoDesejado || ''
  });

  const handleLogout = () => {
    localStorage.removeItem('usuarioAtelie');
    if (onNavigate) {
      onNavigate('inicio');
    }
  };

  const handleVoltarPedidos = () => {
    if (onNavigate) {
      onNavigate(isCostureira ? 'feedPedidos' : 'meusPedidos');
    }
  };

  // Envio de mensagens
  const handleEnviarMensagem = (e) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    const msg = {
      id: Date.now(),
      remetente: papelAtual,
      nomeRemetente: nomeUsuario,
      texto: novaMensagem,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tipo: 'texto'
    };

    setMensagens((prev) => [...prev, msg]);
    setNovaMensagem('');
  };

  // Abrir Modal de Orçamento
  const handleAbrirModalOrcamento = () => {
    if (orcamento) {
      setFormOrcamento({
        descricao: orcamento.descricao,
        valor: orcamento.valor,
        prazo: orcamento.prazo
      });
    }
    setMostrarModalOrcamento(true);
  };

  // Costureira emite ou edita o orçamento
  const handleSalvarOrcamento = (e) => {
    e.preventDefault();
    const valor = parseFloat(formOrcamento.valor);
    const sinal = valor * 0.5;
    const prazo = formOrcamento.prazo;
    const descricao = formOrcamento.descricao;

    if (!valor || valor <= 0) {
      alert('Informe um valor válido para o orçamento.');
      return;
    }

    const eEdicao = !!orcamento;

    const novoOrcamento = {
      id: Date.now(),
      valor,
      sinal,
      prazo,
      descricao,
      aprovado: false
    };

    setOrcamento(novoOrcamento);
    setStatusPagamento('Aguardando Aprovação');
    setMostrarModalOrcamento(false);

    setMensagens((prev) => [
      ...prev,
      {
        id: Date.now(),
        remetente: 'Costureira',
        nomeRemetente: nomeUsuario,
        texto: `PROPOSTA DE ORÇAMENTO ${eEdicao ? 'ATUALIZADA' : 'EMITIDA'}:\nServiço: ${descricao}\nValor Total: R$ ${valor.toFixed(2)}\nSinal (50%): R$ ${sinal.toFixed(2)}\nPrazo Estimado: ${prazo}`,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tipo: 'orcamento',
        dadosOrcamento: novoOrcamento
      }
    ]);
  };

  // Cliente aprova o orçamento
  const handleAprovarOrcamento = () => {
    setOrcamento((prev) => ({ ...prev, aprovado: true }));
    setStatusPagamento('Sinal Pago (50%)');

    setMensagens((prev) => [
      ...prev,
      {
        id: Date.now(),
        remetente: 'Cliente',
        nomeRemetente: nomeUsuario,
        texto: 'Orçamento aprovado! Pagamento do sinal confirmado.',
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tipo: 'sistema'
      }
    ]);
  };

  // Atualização das medidas corporais
  const handleSalvarMedidas = (e) => {
    e.preventDefault();
    setEditandoMedidas(false);
  };

  // Exportar Ficha em TXT
  const handleExportarTXT = () => {
    const conteudo = `=== ATELIÊ ENTRE LINHAS - FICHA DE MEDIDAS ===\nCliente: ${medidas.clienteNome}\nBusto: ${medidas.busto || 'Não informado'}\nCintura: ${medidas.cintura || 'Não informado'}\nQuadril: ${medidas.quadril || 'Não informado'}\nAltura: ${medidas.altura || 'Não informado'}\nComprimento Desejado: ${medidas.comprimentoDesejado || 'Não informado'}\nData de Emissão: ${new Date().toLocaleDateString()}`;

    const element = document.createElement('a');
    const file = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Ficha_Medidas_${medidas.clienteNome.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Exportar Ficha de Medidas em PDF
  const handleExportarPDFMedidas = () => {
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
      <html>
        <head>
          <title>Ficha de Medidas - ${medidas.clienteNome}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #333; }
            h1 { color: #3E2445; border-bottom: 2px solid #3E2445; padding-bottom: 8px; margin-bottom: 5px; }
            h2 { color: #7A5B72; font-size: 18px; margin-top: 0; }
            ul { line-height: 2; font-size: 15px; list-style-type: square; }
            .footer { margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Ateliê Entre Linhas</h1>
          <h2>Ficha Corporal de Medidas</h2>
          <p><strong>Cliente:</strong> ${medidas.clienteNome}</p>
          <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString()}</p>
          <hr />
          <ul>
            <li><strong>Busto:</strong> ${medidas.busto || 'Não preenchido'}</li>
            <li><strong>Cintura:</strong> ${medidas.cintura || 'Não preenchido'}</li>
            <li><strong>Quadril:</strong> ${medidas.quadril || 'Não preenchido'}</li>
            <li><strong>Altura:</strong> ${medidas.altura || 'Não preenchido'}</li>
            <li><strong>Comprimento Desejado:</strong> ${medidas.comprimentoDesejado || 'Não preenchido'}</li>
          </ul>
          <div class="footer">Gerado por Ateliê Entre Linhas</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    janelaImpressao.document.close();
  };

  // Exportar Orçamento em PDF
  const handleExportarPDFOrcamento = () => {
    if (!orcamento) return;
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
      <html>
        <head>
          <title>Orçamento - Ateliê Entre Linhas</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #333; }
            h1 { color: #3E2445; border-bottom: 2px solid #3E2445; padding-bottom: 8px; }
            .box { background: #faf7f5; padding: 20px; border-radius: 6px; border: 1px solid #ddd; margin-top: 15px; }
            .price { font-size: 20px; color: #2e7d32; font-weight: bold; }
            .footer { margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Ateliê Entre Linhas</h1>
          <h2>Comprovante de Proposta de Orçamento</h2>
          <p><strong>Cliente:</strong> ${medidas.clienteNome}</p>
          <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString()}</p>
          
          <div class="box">
            <p><strong>Descrição do Serviço:</strong> ${orcamento.descricao}</p>
            <p class="price">Valor Total: R$ ${orcamento.valor.toFixed(2)}</p>
            <p><strong>Sinal Obrigatório (50%):</strong> R$ ${orcamento.sinal.toFixed(2)}</p>
            <p><strong>Prazo Estimado:</strong> ${orcamento.prazo}</p>
            <p><strong>Status:</strong> ${orcamento.aprovado ? 'Aprovado pelo Cliente' : 'Aguardando Aprovação'}</p>
          </div>
          <div class="footer">Gerado por Ateliê Entre Linhas</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    janelaImpressao.document.close();
  };

  return (
    <div style={{ maxWidth: '950px', margin: '20px auto', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* CABEÇALHO SUPERIOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
        <div>
          <h2 style={{ color: '#3E2445', margin: 0, fontSize: '22px' }}>
            Chat de Negociação
          </h2>
          <span style={{ fontSize: '13px', color: '#666', marginTop: '4px', display: 'block' }}>
            Usuário: <strong>{nomeUsuario}</strong> ({papelAtual})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleVoltarPedidos}
            style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            ← Ver Pedidos
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* COLUNA ESQUERDA: CHAT DE MENSAGENS */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', display: 'flex', flexDirection: 'column', height: '580px', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', background: '#3E2445', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px' }}>Atendimento Direto</h4>
              <small style={{ color: '#EAE3EA' }}>Conectado como: {nomeUsuario}</small>
            </div>
          </div>

          {/* ÁREA DE MENSAGENS */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#FAF7F5' }}>
            {mensagens.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', marginTop: '160px' }}>
                <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#3E2445' }}>Nenhuma mensagem na conversa.</p>
                <p style={{ fontSize: '13px' }}>Digite uma mensagem abaixo para iniciar a negociação do serviço.</p>
              </div>
            ) : (
              mensagens.map((msg) => {
                const eEu = msg.remetente === papelAtual;
                const eSistema = msg.tipo === 'sistema';

                if (eSistema) {
                  return (
                    <div key={msg.id} style={{ textAlign: 'center', margin: '12px 0', fontSize: '13px', color: '#2e7d32', background: '#e8f5e9', padding: '10px', borderRadius: '6px', fontWeight: 'bold' }}>
                      {msg.texto}
                    </div>
                  );
                }

                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: eEu ? 'flex-end' : 'flex-start', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', color: '#777', marginBottom: '3px' }}>
                      {msg.nomeRemetente} ({msg.remetente}) • {msg.hora}
                    </span>
                    <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '12px', background: eEu ? '#3E2445' : '#fff', color: eEu ? '#fff' : '#333', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', whiteSpace: 'pre-line', fontSize: '14px' }}>
                      {msg.texto}

                      {msg.tipo === 'orcamento' && (
                        <div style={{ marginTop: '10px', padding: '10px', background: eEu ? 'rgba(255,255,255,0.15)' : '#F4EFF5', borderRadius: '6px', borderLeft: '4px solid #3E2445' }}>
                          {!isCostureira && !orcamento?.aprovado && (
                            <button
                              onClick={handleAprovarOrcamento}
                              style={{ width: '100%', marginTop: '8px', padding: '8px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                            >
                              Aprovar Orçamento e Pagar Sinal (R$ {msg.dadosOrcamento.sinal.toFixed(2)})
                            </button>
                          )}
                          {orcamento?.aprovado && (
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: eEu ? '#81c784' : '#2e7d32', display: 'block', marginTop: '6px' }}>
                              Orçamento Aprovado pelo Cliente
                            </span>
                          )}
                        </div>
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
              style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', fontSize: '14px' }}
            />
            <button type="submit" style={{ padding: '10px 20px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
              Enviar
            </button>
          </form>
        </div>

        {/* COLUNA DIREITA: FINANCEIRO E MEDIDAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Painel Financeiro */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#3E2445', fontSize: '16px', fontWeight: 'bold' }}>Status Financeiro</h3>

            <div style={{ padding: '10px 12px', background: '#FAF7F5', borderRadius: '6px', marginBottom: '14px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#555' }}>
                <strong>Status do Pagamento:</strong>
              </p>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: statusPagamento === 'Quitado' ? '#e8f5e9' : statusPagamento.includes('Sinal') ? '#e3f2fd' : statusPagamento === 'Aguardando Aprovação' ? '#fff3e0' : '#f5f5f5',
                  color: statusPagamento === 'Quitado' ? '#2e7d32' : statusPagamento.includes('Sinal') ? '#1565c0' : statusPagamento === 'Aguardando Aprovação' ? '#e65100' : '#666'
                }}
              >
                {statusPagamento}
              </span>
            </div>

            {orcamento ? (
              <div style={{ fontSize: '13px', color: '#333' }}>
                <p style={{ margin: '4px 0' }}><strong>Total:</strong> R$ {orcamento.valor.toFixed(2)}</p>
                <p style={{ margin: '4px 0' }}><strong>Sinal (50%):</strong> R$ {orcamento.sinal.toFixed(2)}</p>
                <p style={{ margin: '4px 0' }}><strong>Prazo:</strong> {orcamento.prazo}</p>

                <button
                  onClick={handleExportarPDFOrcamento}
                  style={{ width: '100%', padding: '9px', marginTop: '12px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Gerar PDF do Orçamento
                </button>

                {/* EDITAR ORÇAMENTO SE FOR COSTUREIRA E NÃO TIVER SIDO APROVADO */}
                {isCostureira && !orcamento.aprovado && (
                  <button
                    onClick={handleAbrirModalOrcamento}
                    style={{ width: '100%', padding: '9px', marginTop: '8px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    Editar Orçamento
                  </button>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#777', margin: '8px 0' }}>Nenhum orçamento emitido ainda para esta conversa.</p>
            )}

            {/* BOTÃO EMITIR ORÇAMENTO SE FOR COSTUREIRA */}
            {isCostureira && !orcamento && (
              <button
                onClick={handleAbrirModalOrcamento}
                style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                + Emitir Orçamento
              </button>
            )}
          </div>

          {/* Painel da Ficha de Medidas */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#3E2445', fontSize: '16px', fontWeight: 'bold' }}>Ficha de Medidas</h3>
              
              <button
                onClick={() => setEditandoMedidas(!editandoMedidas)}
                style={{ background: 'none', border: 'none', color: '#3E2445', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline' }}
              >
                {editandoMedidas ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            {editandoMedidas ? (
              <form onSubmit={handleSalvarMedidas} style={{ fontSize: '12px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontWeight: 'bold', color: '#333' }}>Busto:</label>
                  <input type="text" value={medidas.busto} onChange={(e) => setMedidas({ ...medidas, busto: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '2px' }} placeholder="Ex: 90 cm" />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontWeight: 'bold', color: '#333' }}>Cintura:</label>
                  <input type="text" value={medidas.cintura} onChange={(e) => setMedidas({ ...medidas, cintura: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '2px' }} placeholder="Ex: 70 cm" />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontWeight: 'bold', color: '#333' }}>Quadril:</label>
                  <input type="text" value={medidas.quadril} onChange={(e) => setMedidas({ ...medidas, quadril: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '2px' }} placeholder="Ex: 98 cm" />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontWeight: 'bold', color: '#333' }}>Altura:</label>
                  <input type="text" value={medidas.altura} onChange={(e) => setMedidas({ ...medidas, altura: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '2px' }} placeholder="Ex: 1.65 m" />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontWeight: 'bold', color: '#333' }}>Comprimento Desejado:</label>
                  <input type="text" value={medidas.comprimentoDesejado} onChange={(e) => setMedidas({ ...medidas, comprimentoDesejado: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '2px' }} placeholder="Ex: 100 cm" />
                </div>
                <button type="submit" style={{ width: '100%', padding: '8px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  Salvar Medidas
                </button>
              </form>
            ) : (
              <ul style={{ paddingLeft: '18px', fontSize: '13px', margin: '0 0 14px 0', lineHeight: '1.7', color: '#333' }}>
                <li><strong>Busto:</strong> {medidas.busto || <span style={{ color: '#aaa' }}>Não informado</span>}</li>
                <li><strong>Cintura:</strong> {medidas.cintura || <span style={{ color: '#aaa' }}>Não informado</span>}</li>
                <li><strong>Quadril:</strong> {medidas.quadril || <span style={{ color: '#aaa' }}>Não informado</span>}</li>
                <li><strong>Altura:</strong> {medidas.altura || <span style={{ color: '#aaa' }}>Não informado</span>}</li>
                <li><strong>Comprimento:</strong> {medidas.comprimentoDesejado || <span style={{ color: '#aaa' }}>Não informado</span>}</li>
              </ul>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={handleExportarPDFMedidas}
                style={{ width: '100%', padding: '8px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                Exportar Ficha em PDF
              </button>

              <button
                onClick={handleExportarTXT}
                style={{ width: '100%', padding: '8px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                Baixar Texto (.TXT)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EMISSÃO OU EDIÇÃO DE ORÇAMENTO */}
      {mostrarModalOrcamento && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '420px', maxWidth: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#3E2445', fontSize: '18px' }}>
              {orcamento ? 'Editar Proposta de Orçamento' : 'Emitir Proposta de Orçamento'}
            </h3>
            <form onSubmit={handleSalvarOrcamento}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Descrição do Serviço:</label>
                <input
                  type="text"
                  value={formOrcamento.descricao}
                  onChange={(e) => setFormOrcamento({ ...formOrcamento, descricao: e.target.value })}
                  placeholder="Ex: Ajuste de barra e zíper"
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Valor Total (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  value={formOrcamento.valor}
                  onChange={(e) => setFormOrcamento({ ...formOrcamento, valor: e.target.value })}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Prazo Estimado de Entrega:</label>
                <input
                  type="text"
                  value={formOrcamento.prazo}
                  onChange={(e) => setFormOrcamento({ ...formOrcamento, prazo: e.target.value })}
                  placeholder="Ex: 3 dias úteis"
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalOrcamento(false)}
                  style={{ padding: '10px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  {orcamento ? 'Salvar Alterações' : 'Enviar Proposta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;