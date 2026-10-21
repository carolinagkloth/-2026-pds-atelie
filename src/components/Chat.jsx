import React, { useState } from 'react';

function Chat({ usuarioLogado, onNavigate }) {
  // Define o papel real com base no login do usuário
  const papelAtual = usuarioLogado?.tipo_usuario || 'Cliente';

  // Ficha de medidas zerada/editável
  const [medidas, setMedidas] = useState({
    clienteNome: usuarioLogado?.tipo_usuario === 'Cliente' ? usuarioLogado.nome : 'Cliente',
    busto: '',
    cintura: '',
    quadril: '',
    altura: '',
    comprimentoDesejado: ''
  });

  const [editandoMedidas, setEditandoMedidas] = useState(false);

  // Histórico de mensagens limpo
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');

  // Estados de orçamento e pagamento zerados
  const [mostrarModalOrcamento, setMostrarModalOrcamento] = useState(false);
  const [orcamento, setOrcamento] = useState(null);
  const [statusPagamento, setStatusPagamento] = useState('Sem Orçamento');

  // Envio de mensagens reais
  const handleEnviarMensagem = (e) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    const msg = {
      id: Date.now(),
      remetente: papelAtual,
      nomeRemetente: usuarioLogado?.nome || papelAtual,
      texto: novaMensagem,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tipo: 'texto'
    };

    setMensagens((prev) => [...prev, msg]);
    setNovaMensagem('');
  };

  // Costureira emite orçamento real
  const handleEmitirOrcamento = (e) => {
    e.preventDefault();
    const form = e.target;
    const valor = parseFloat(form.valor.value);
    const sinal = valor * 0.5;
    const prazo = form.prazo.value;
    const descricao = form.descricao.value;

    if (!valor || valor <= 0) {
      alert('Informe um valor válido para o orçamento.');
      return;
    }

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
        nomeRemetente: usuarioLogado?.nome || 'Costureira',
        texto: `PROPOSTA DE ORÇAMENTO EMITIDA:\n- Serviço: ${descricao}\n- Valor Total: R$ ${valor.toFixed(2)}\n- Sinal (50%): R$ ${sinal.toFixed(2)}\n- Prazo Estimado: ${prazo}`,
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
        nomeRemetente: usuarioLogado?.nome || 'Cliente',
        texto: '✅ Orçamento aprovado! Pagamento do sinal confirmado.',
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

  // Exportar Ficha de Medidas em PDF (Sem " - Sistema de Gestão" no final)
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
    <div style={{ maxWidth: '950px', margin: '10px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* COLUNA ESQUERDA: CHAT */}
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '550px' }}>
          <div style={{ padding: '15px', background: '#3E2445', color: '#fff', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0 }}>Atendimento e Negociação</h4>
              <small style={{ color: '#EAE3EA' }}>Conectado como: {usuarioLogado?.nome || papelAtual} ({papelAtual})</small>
            </div>
          </div>

          {/* ÁREA DE MENSAGENS */}
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: '#FAF7F5' }}>
            {mensagens.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', marginTop: '150px' }}>
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Nenhuma mensagem na conversa.</p>
                <p style={{ fontSize: '13px' }}>Digite uma mensagem abaixo para iniciar a negociação.</p>
              </div>
            ) : (
              mensagens.map((msg) => {
                const eEu = msg.remetente === papelAtual;
                const eSistema = msg.tipo === 'sistema';

                if (eSistema) {
                  return (
                    <div key={msg.id} style={{ textAlign: 'center', margin: '10px 0', fontSize: '13px', color: '#2e7d32', background: '#e8f5e9', padding: '8px', borderRadius: '4px' }}>
                      {msg.texto}
                    </div>
                  );
                }

                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: eEu ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#777', marginBottom: '2px' }}>
                      {msg.nomeRemetente} ({msg.remetente}) • {msg.hora}
                    </span>
                    <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: '12px', background: eEu ? '#3E2445' : '#fff', color: eEu ? '#fff' : '#333', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', whiteSpace: 'pre-line' }}>
                      {msg.texto}

                      {msg.tipo === 'orcamento' && (
                        <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', borderLeft: '4px solid #FFD700' }}>
                          {papelAtual === 'Cliente' && !orcamento?.aprovado && (
                            <button
                              onClick={handleAprovarOrcamento}
                              style={{ width: '100%', marginTop: '8px', padding: '8px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              Aprovar Orçamento e Pagar Sinal (R$ {msg.dadosOrcamento.sinal.toFixed(2)})
                            </button>
                          )}
                          {orcamento?.aprovado && (
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#81c784', display: 'block', marginTop: '6px' }}>
                              ✔ Orçamento Aprovado
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

          <form onSubmit={handleEnviarMensagem} style={{ padding: '12px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ padding: '10px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Enviar
            </button>
          </form>
        </div>

        {/* COLUNA DIREITA: PAINÉIS LATERAIS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Painel Financeiro */}
          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#3E2445', fontSize: '16px' }}>Status Financeiro</h3>

            <div style={{ padding: '10px', background: '#FAF7F5', borderRadius: '6px', marginBottom: '12px' }}>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                <strong>Status de Pagamento:</strong>
              </p>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 8px',
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
              <div style={{ fontSize: '13px' }}>
                <p style={{ margin: '4px 0' }}><strong>Total:</strong> R$ {orcamento.valor.toFixed(2)}</p>
                <p style={{ margin: '4px 0' }}><strong>Sinal (50%):</strong> R$ {orcamento.sinal.toFixed(2)}</p>
                <p style={{ margin: '4px 0' }}><strong>Prazo:</strong> {orcamento.prazo}</p>

                <button
                  onClick={handleExportarPDFOrcamento}
                  style={{ width: '100%', padding: '8px', marginTop: '10px', background: '#7A5B72', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  📄 Gerar PDF do Orçamento
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#777' }}>Nenhum orçamento emitido ainda para esta conversa.</p>
            )}

            {papelAtual === 'Costureira' && !orcamento && (
              <button
                onClick={() => setMostrarModalOrcamento(true)}
                style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                + Emitir Orçamento
              </button>
            )}
          </div>

          {/* Painel da Ficha de Medidas */}
          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#3E2445', fontSize: '16px' }}>Ficha de Medidas</h3>
              {papelAtual === 'Cliente' && (
                <button
                  onClick={() => setEditandoMedidas(!editandoMedidas)}
                  style={{ background: 'none', border: 'none', color: '#7A5B72', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                >
                  {editandoMedidas ? 'Cancelar' : 'Editar'}
                </button>
              )}
            </div>

            {editandoMedidas ? (
              <form onSubmit={handleSalvarMedidas} style={{ fontSize: '12px' }}>
                <div style={{ marginBottom: '6px' }}>
                  <label>Busto:</label>
                  <input type="text" value={medidas.busto} onChange={(e) => setMedidas({ ...medidas, busto: e.target.value })} style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }} placeholder="Ex: 90 cm" />
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <label>Cintura:</label>
                  <input type="text" value={medidas.cintura} onChange={(e) => setMedidas({ ...medidas, cintura: e.target.value })} style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }} placeholder="Ex: 70 cm" />
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <label>Quadril:</label>
                  <input type="text" value={medidas.quadril} onChange={(e) => setMedidas({ ...medidas, quadril: e.target.value })} style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }} placeholder="Ex: 98 cm" />
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <label>Altura:</label>
                  <input type="text" value={medidas.altura} onChange={(e) => setMedidas({ ...medidas, altura: e.target.value })} style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }} placeholder="Ex: 1.65 m" />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Comprimento Desejado:</label>
                  <input type="text" value={medidas.comprimentoDesejado} onChange={(e) => setMedidas({ ...medidas, comprimentoDesejado: e.target.value })} style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }} placeholder="Ex: 100 cm" />
                </div>
                <button type="submit" style={{ width: '100%', padding: '6px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Salvar Medidas
                </button>
              </form>
            ) : (
              <ul style={{ paddingLeft: '20px', fontSize: '13px', margin: '0 0 12px 0', lineHeight: '1.6' }}>
                <li><strong>Busto:</strong> {medidas.busto || <span style={{ color: '#aaa' }}>Não informado</span>}</li>
                <li><strong>Cintura:</strong> {medidas.cintura || <span style={{ color: '#aaa' }}>Não informado</span>}</li>
                <li><strong>Quadril:</strong> {medidas.quadril || <span style={{ color: '#aaa' }}>Não informado</span>}</li>
                <li><strong>Comprimento:</strong> {medidas.comprimentoDesejado || <span style={{ color: '#aaa' }}>Não informado</span>}</li>
              </ul>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={handleExportarPDFMedidas}
                style={{ width: '100%', padding: '8px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                🖨️ Exportar Ficha em PDF
              </button>

              <button
                onClick={handleExportarTXT}
                style={{ width: '100%', padding: '8px', background: '#7A5B72', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
              >
                📄 Baixar Texto (.TXT)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE ORÇAMENTO */}
      {mostrarModalOrcamento && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#3E2445' }}>Emitir Proposta de Orçamento</h3>
            <form onSubmit={handleEmitirOrcamento}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '13px' }}>Descrição do Serviço:</label>
                <input type="text" name="descricao" placeholder="Ex: Ajuste de barra e zíper" style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '13px' }}>Valor Total (R$):</label>
                <input type="number" step="0.01" name="valor" placeholder="0.00" style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px' }}>Prazo Estimado de Entrega:</label>
                <input type="text" name="prazo" placeholder="Ex: 3 dias úteis" style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setMostrarModalOrcamento(false)} style={{ padding: '8px 12px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '8px 12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Enviar Proposta
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