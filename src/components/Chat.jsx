import React from 'react';
import ChatContainer from './chat/ChatContainer';

function Chat(props) {
  return <ChatContainer {...props} />;
}

export default Chat;

/*
import React, { useState, useEffect, useRef } from 'react';

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
  const [carregando, setCarregando] = useState(false);

  // Modais
  const [mostrarModalProposta, setMostrarModalProposta] = useState(false);
  const [mostrarModalMedidas, setMostrarModalMedidas] = useState(false);
  const [mostrarModalProva, setMostrarModalProva] = useState(false);
  const [mostrarModalAvaliacao, setMostrarModalAvaliacao] = useState(false);

  // Estados de Avaliação
  const [notaAvaliacao, setNotaAvaliacao] = useState(5);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
  const [idOrdemServicoAvaliacao, setIdOrdemServicoAvaliacao] = useState(null);

  // Form de Agendar Prova
  const [formProva, setFormProva] = useState({
    dataProva: '',
    horarioProva: '14:00',
    semPreferenciaHorario: false,
    observacao: ''
  });

  const [orcamentoAtual, setOrcamentoAtual] = useState({
    total: 0,
    entrada: 0,
    prazo: '',
    horarioEntrega: '',
    status: pedido?.status_kanban || pedido?.status_pedido || pedido?.status || 'Aberto',
    descricao: ''
  });

  const [medidas, setMedidas] = useState({
    busto: '',
    cintura: '',
    quadril: '',
    altura: '',
    comprimento: '',
    observacoes_medidas: ''
  });

  // Form de Proposta com Horário Obrigatório
  const [propostaForm, setPropostaForm] = useState({
    descricao: '',
    tipoServico: 'Ajuste / Conserto',
    valorTotal: 'R$ 0,00',
    valorEntrada: 'R$ 0,00',
    previsaoEntrega: '',
    horarioEntrega: '14:00'
  });

  const chatBottomRef = useRef(null);

  const idPedido = pedido?.id || pedido?.id_pedido;
  const idClientePedido = pedido?.clienteId || pedido?.id_cliente || (isCostureira ? null : idUsuario);
  const idCostureiraPedido = pedido?.costureiraId || pedido?.id_costureira;

  useEffect(() => {
    if (idPedido) {
      carregarMensagens();
    }
    carregarMedidasCliente();
  }, [idPedido, idClientePedido]);

  // --- UTILS: LIMPEZA DE TEXTO E MÁSCARA ---
  const extrairDescricaoLimpa = (texto) => {
    if (!texto) return '';
    return texto.replace(/^\[.*?\]\s*-\s*Localização:.*?\n\n?/gi, '').trim();
  };

  const extrairTipoServico = (texto) => {
    if (!texto) return 'Ajuste / Conserto';
    const match = texto.match(/^\[(.*?)\]/);
    return match ? match[1] : 'Ajuste / Conserto';
  };

  const mascararMoeda = (valorRaw) => {
    let valor = String(valorRaw).replace(/\D/g, '');
    if (!valor) return 'R$ 0,00';
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    valor = valor.replace('.', ',');
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${valor}`;
  };

  const extrairValorDecimal = (valorFormatado) => {
    if (!valorFormatado) return 0;
    const limpo = String(valorFormatado).replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
  };

  const formatarDataHeader = (dataStr) => {
    if (!dataStr) return '';
    const dataMsg = new Date(dataStr);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);

    if (dataMsg.toDateString() === hoje.toDateString()) return 'Hoje';
    if (dataMsg.toDateString() === ontem.toDateString()) return 'Ontem';
    return dataMsg.toLocaleDateString('pt-BR');
  };

  const formatarHoraMsg = (dataStr) => {
    if (!dataStr) return '';
    const d = new Date(dataStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // --- EXPORTAÇÃO PDF E TXT ---
  const handleExportarTXT = () => {
    const conteudo = `==================================================
ATELIÊ CONECTA - FICHA DO PEDIDO #${idPedido}
==================================================
Data do Documento: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Status Atual: ${orcamentoAtual.status}

1. RESUMO DO SERVIÇO:
--------------------------------------------------
Descrição: ${extrairDescricaoLimpa(pedido?.descricao || '')}
Tipo de Serviço: ${extrairTipoServico(pedido?.descricao || '')}
Cliente: ${pedido?.clienteNome || 'Cliente'}

2. ORÇAMENTO & CONTRATO:
--------------------------------------------------
Valor Total: R$ ${Number(orcamentoAtual.total || 0).toFixed(2)}
Entrada / Sinal: R$ ${Number(orcamentoAtual.entrada || 0).toFixed(2)}
Previsão de Entrega: ${orcamentoAtual.prazo || 'A combinar'} ${orcamentoAtual.horarioEntrega ? `às ${orcamentoAtual.horarioEntrega}` : ''}

3. FICHA DE MEDIDAS DO CLIENTE:
--------------------------------------------------
Busto: ${medidas.busto || 'Não informado'} cm
Cintura: ${medidas.cintura || 'Não informado'} cm
Quadril: ${medidas.quadril || 'Não informado'} cm
Observações: ${medidas.observacoes_medidas || 'Nenhuma'}
==================================================`;

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pedido_${idPedido}_Ficha_Contrato.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportarPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para exportar o PDF.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha e Contrato - Pedido #${idPedido}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; line-height: 1.5; }
          .header { border-bottom: 2px solid #3E2445; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .title { color: #3E2445; font-size: 22px; font-weight: bold; margin: 0; }
          .status { background: #FAF6FA; border: 1px solid #3E2445; color: #3E2445; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 13px; }
          .box { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 20px; background: #fafafa; }
          .box-title { color: #3E2445; font-size: 16px; font-weight: bold; margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; font-size: 14px; }
          th { color: #555; width: 35%; }
          .footer { text-align: center; font-size: 11px; color: #888; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Ateliê Conecta - Pedido #${idPedido}</h1>
            <small>Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</small>
          </div>
          <div class="status">Status: ${orcamentoAtual.status}</div>
        </div>

        <div class="box">
          <h3 class="box-title">Descrição do Serviço</h3>
          <p><strong>Tipo:</strong> ${extrairTipoServico(pedido?.descricao || '')}</p>
          <p><strong>Detalhes:</strong> ${extrairDescricaoLimpa(pedido?.descricao || '')}</p>
          <p><strong>Cliente:</strong> ${pedido?.clienteNome || 'Cliente'}</p>
        </div>

        <div class="box">
          <h3 class="box-title">Orçamento & Contrato Formalizado</h3>
          <table>
            <tr><th>Valor Total:</th><td>R$ ${Number(orcamentoAtual.total || 0).toFixed(2)}</td></tr>
            <tr><th>Entrada / Sinal:</th><td>R$ ${Number(orcamentoAtual.entrada || 0).toFixed(2)}</td></tr>
            <tr><th>Previsão de Entrega:</th><td>${orcamentoAtual.prazo || 'A combinar'} ${orcamentoAtual.horarioEntrega ? `às ${orcamentoAtual.horarioEntrega}` : ''}</td></tr>
          </table>
        </div>

        <div class="box">
          <h3 class="box-title">Ficha de Medidas</h3>
          <table>
            <tr><th>Busto:</th><td>${medidas.busto || '-'} cm</td></tr>
            <tr><th>Cintura:</th><td>${medidas.cintura || '-'} cm</td></tr>
            <tr><th>Quadril:</th><td>${medidas.quadril || '-'} cm</td></tr>
            <tr><th>Observações:</th><td>${medidas.observacoes_medidas || 'Nenhuma'}</td></tr>
          </table>
        </div>

        <div class="footer">
          <p>Ateliê Conecta - Plataforma de Negociação e Serviços Sob Medida</p>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const carregarMedidasCliente = () => {
    const targetId = idClientePedido || idUsuario;
    if (!targetId) return;

    fetch(`/api/usuarios/${targetId}/medidas`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.erro) {
          setMedidas({
            busto: data.busto || '',
            cintura: data.cintura || '',
            quadril: data.quadril || '',
            altura: data.altura || '',
            comprimento: data.comprimento || '',
            observacoes_medidas: data.observacoes_medidas || ''
          });
        }
      })
      .catch(() => {});
  };

  const carregarMensagens = async () => {
    setCarregando(true);
    try {
      const [resMsgs, resPed] = await Promise.all([
        fetch(`/api/mensagens-chat/${idPedido}`),
        fetch(`/api/pedidos/${idPedido}`).catch(() => null)
      ]);

      const data = await resMsgs.json();
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

          setOrcamentoAtual((prev) => ({
            ...prev,
            total: dados.valorTotal || propostaExistente.valorProposta || propostaExistente.valor_proposta || 0,
            entrada: dados.valorEntrada || propostaExistente.valorEntrada || propostaExistente.valor_entrada || 0,
            prazo: dados.previsaoEntrega || pedido?.prazoDesejado || '',
            horarioEntrega: dados.horarioEntrega || '',
            descricao: dados.descricaoServico || ''
          }));
        }
      }

      if (resPed && resPed.ok) {
        const pedData = await resPed.json();
        const statusReal = pedData.status_kanban || pedData.status_pedido || pedData.status;
        if (statusReal) {
          setOrcamentoAtual((prev) => ({ ...prev, status: statusReal }));
        }
      }
    } catch (err) {
      console.error('Erro ao recarregar chat:', err);
    } finally {
      setCarregando(false);
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  // --- ENVIAR PROPOSTA (SEM LOCALIZAÇÃO & COM HORÁRIO OBRIGATÓRIO) ---
  const handleEnviarProposta = async (e) => {
    e.preventDefault();
    const total = extrairValorDecimal(propostaForm.valorTotal);
    if (total <= 0) {
      alert('Informe um valor total válido.');
      return;
    }

    if (!propostaForm.previsaoEntrega || !propostaForm.horarioEntrega) {
      alert('A data e o horário limite de entrega são obrigatórios para a formalização do contrato.');
      return;
    }

    const entrada = extrairValorDecimal(propostaForm.valorEntrada);
    const dataFormatada = new Date(propostaForm.previsaoEntrega + 'T12:00:00').toLocaleDateString('pt-BR');

    const textoFormatado = `Proposta de Orçamento:\nServiço: [${propostaForm.tipoServico}]\nDescrição: ${propostaForm.descricao}\nValor Total: R$ ${total.toFixed(2)}${entrada > 0 ? `\nEntrada (Sinal): R$ ${entrada.toFixed(2)}` : ''}\nPrevisão de Entrega: ${dataFormatada} às ${propostaForm.horarioEntrega}`;

    try {
      const response = await fetch('/api/mensagens-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_remetente: Number(idUsuario),
          conteudo: textoFormatado,
          tipo_mensagem: 'proposta',
          valor_entrada: entrada,
          valor_proposta: total,
          dados_proposta: {
            descricaoServico: propostaForm.descricao,
            tipoServico: propostaForm.tipoServico,
            valorTotal: total,
            valorEntrada: entrada,
            previsaoEntrega: propostaForm.previsaoEntrega,
            horarioEntrega: propostaForm.horarioEntrega,
            idCostureira: idUsuario,
            status: 'pendente'
          }
        })
      });

      if (response.ok) {
        setMostrarModalProposta(false);
        carregarMensagens();
        alert('Proposta enviada!');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleAceitarProposta = async (dadosProposta, idRemetenteProposta) => {
    const idCostureira = dadosProposta.idCostureira || idRemetenteProposta || idCostureiraPedido;

    try {
      const response = await fetch('/api/ordens-servico/aceitar-proposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_costureira: Number(idCostureira),
          valor_total: dadosProposta.valorTotal || orcamentoAtual.total,
          valor_entrada: dadosProposta.valorEntrada || orcamentoAtual.entrada,
          previsao_entrega: dadosProposta.previsaoEntrega || orcamentoAtual.prazo
        })
      });

      if (response.ok) {
        alert('Orçamento aprovado! O pedido iniciou em Produção.');
        setOrcamentoAtual((prev) => ({ ...prev, status: 'Em Produção' }));
        carregarMensagens();
      } else {
        const data = await response.json();
        alert(data.erro || 'Erro ao aprovar proposta.');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleRecusarProposta = async (idMensagem, idRemetenteProposta) => {
    if (!window.confirm('Deseja realmente recusar esta proposta de orçamento?')) return;

    try {
      const response = await fetch('/api/ordens-servico/recusar-proposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_mensagem: Number(idMensagem),
          id_costureira: Number(idRemetenteProposta || idCostureiraPedido || 0)
        })
      });

      if (response.ok) {
        alert('Proposta recusada com sucesso.');
        carregarMensagens();
      } else {
        const data = await response.json();
        alert(data.erro || 'Erro ao recusar proposta.');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  // --- CANCELAMENTO GLOBAL DO PEDIDO ---
  const handleCancelarPedido = async () => {
    const motivo = isCostureira 
      ? 'Deseja realmente desistir/cancelar este pedido? O pedido ficará marcado como cancelado.'
      : 'Deseja realmente cancelar este pedido?';

    if (!window.confirm(motivo)) return;

    try {
      const response = await fetch('/api/pedidos/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pedido: Number(idPedido),
          id_usuario: Number(idUsuario)
        })
      });

      if (response.ok) {
        alert('Pedido cancelado com sucesso.');
        setOrcamentoAtual((prev) => ({ ...prev, status: 'Cancelado' }));
        carregarMensagens();
      } else {
        // Fallback para alterar status kanban diretamente
        await fetch(`/api/ordens-servico/${idPedido}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status_kanban: 'Cancelado' })
        });
        setOrcamentoAtual((prev) => ({ ...prev, status: 'Cancelado' }));
        carregarMensagens();
      }
    } catch (err) {
      alert(`Erro ao cancelar pedido: ${err.message}`);
    }
  };

  // --- CONCLUIR SERVIÇO ---
  const handleConcluirServico = async () => {
    if (!window.confirm('Confirma que a peça está pronta para entrega/retirada?')) return;

    try {
      const res = await fetch('/api/ordens-servico/concluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pedido: Number(idPedido), id_costureira: Number(idUsuario) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao concluir serviço.');

      alert('Peça marcada como concluída! A cliente foi notificada.');
      setOrcamentoAtual((prev) => ({ ...prev, status: 'Concluído' }));
      carregarMensagens();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- REGRA: VERIFICA SE O CONTRATO JÁ FOI ACEITO ---
  const contratoAtivo = ['Em Produção', 'Aguardando Prova', 'Concluído', 'Entregue'].includes(orcamentoAtual.status);
  const podeEnviarOrçamento = isCostureira && !contratoAtivo && orcamentoAtual.status !== 'Cancelado';

  let ultimaDataHeader = null;

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '20px 25px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: '#3E2445', margin: 0, fontSize: '22px' }}>Chat de Negociação</h2>
          <span style={{ fontSize: '13px', color: '#666', marginTop: '4px', display: 'block' }}>
            Usuário: <strong>{nomeUsuario}</strong> ({isCostureira ? 'Costureira' : 'Cliente'})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={carregarMensagens} 
            disabled={carregando}
            style={{ padding: '9px 16px', background: '#fff', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            {carregando ? '🔄 Atualizando...' : '🔄 Atualizar'}
          </button>
          <button onClick={() => onNavigate && onNavigate('meusChats')} style={{ padding: '9px 16px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
            Conversas
          </button>
          <button onClick={() => onNavigate && onNavigate(isCostureira ? 'feedPedidos' : 'meusPedidos')} style={{ padding: '9px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
            Ver Pedidos
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', display: 'flex', flexDirection: 'column', height: '620px', overflow: 'hidden' }}>
          <div style={{ background: '#3E2445', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Atendimento Direto</h3>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>Pedido #{idPedido}</span>
          </div>

          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#FAF7FA', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mensagens.map((msg, index) => {
              const rawData = msg.data_hora_envio || msg.dataHoraEnvio;
              const dataHeader = formatarDataHeader(rawData);
              const exibirDivisor = dataHeader && dataHeader !== ultimaDataHeader;
              if (exibirDivisor) ultimaDataHeader = dataHeader;

              const ehMinha = Number(msg.id_remetente || msg.idRemetente) === Number(idUsuario);
              const ehProposta = msg.tipo_mensagem === 'proposta' || (msg.conteudo && msg.conteudo.includes('Proposta de Orçamento:'));

              let dadosProposta = msg.dados_proposta || {};
              if (typeof dadosProposta === 'string') {
                try { dadosProposta = JSON.parse(dadosProposta); } catch { dadosProposta = {}; }
              }
              const statusProposta = dadosProposta.status || 'pendente';

              return (
                <React.Fragment key={msg.id_mensagem || msg.id || index}>
                  {exibirDivisor && (
                    <div style={{ textAlign: 'center', margin: '15px 0' }}>
                      <span style={{ background: '#E0D0E0', color: '#3E2445', padding: '4px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                        {dataHeader}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: ehMinha ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', background: ehMinha ? '#3E2445' : '#fff', color: ehMinha ? '#fff' : '#333', border: ehMinha ? 'none' : '1px solid #E0D0E0', padding: '12px 16px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: ehMinha ? '#EADCEB' : '#777', marginBottom: '4px', fontWeight: 'bold' }}>
                        {msg.remetente_nome || msg.nomeRemetente || (ehMinha ? 'Você' : 'Interlocutor')}
                      </div>

                      <div style={{ fontSize: '14px', whiteSpace: 'pre-line', paddingBottom: '12px' }}>
                        {msg.conteudo}
                      </div>

                      {ehProposta && (
                        <div style={{ marginTop: '8px', background: ehMinha ? 'rgba(255,255,255,0.1)' : '#FAF7FA', padding: '10px', borderRadius: '8px', border: '1px solid rgba(62, 36, 69, 0.2)' }}>
                          {statusProposta === 'recusada' ? (
                            <div style={{ background: '#FFEBEE', color: '#C62828', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                              ✕ Orçamento Recusado
                            </div>
                          ) : contratoAtivo ? (
                            <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                              ✓ Orçamento Aprovado (Contrato Ativo)
                            </div>
                          ) : !isCostureira ? (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                              <button
                                onClick={() => handleAceitarProposta(dadosProposta, msg.id_remetente || msg.idRemetente)}
                                style={{ flex: 1, padding: '8px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                              >
                                ✓ Aceitar Orçamento
                              </button>
                              <button
                                onClick={() => handleRecusarProposta(msg.id_mensagem || msg.id, msg.id_remetente || msg.idRemetente)}
                                style={{ flex: 1, padding: '8px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                              >
                                ✕ Recusar
                              </button>
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: ehMinha ? '#EADCEB' : '#666', fontStyle: 'italic', textAlign: 'center' }}>
                              Aguardando aprovação da cliente...
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ fontSize: '10px', color: ehMinha ? '#EADCEB' : '#999', textAlign: 'right', marginTop: '4px' }}>
                        {formatarHoraMsg(rawData)}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleEnviarMensagem} style={{ padding: '15px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={orcamentoAtual.status === 'Cancelado'}
              style={{ flex: 1, padding: '11px 14px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
            />
            <button type="submit" disabled={orcamentoAtual.status === 'Cancelado'} style={{ padding: '11px 20px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Enviar
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#3E2445', fontSize: '17px', fontWeight: 'bold' }}>Status do Pedido</h3>
            
            <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: '8px', padding: '12px', marginBottom: '15px' }}>
              <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Status Atual:</span>
              <strong style={{ color: '#E65100', fontSize: '14px' }}>{orcamentoAtual.status}</strong>
            </div>

            {!isCostureira && idCostureiraPedido && (
              <button
                onClick={() => onNavigate && onNavigate('perfil', idCostureiraPedido)}
                style={{ width: '100%', padding: '10px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', marginBottom: '10px' }}
              >
                👤 Ver Perfil da Costureira
              </button>
            )}

            {podeEnviarOrçamento && (
              <button
                onClick={() => {
                  setPropostaForm({
                    descricao: extrairDescricaoLimpa(pedido?.descricao || ''),
                    tipoServico: extrairTipoServico(pedido?.descricao || ''),
                    valorTotal: 'R$ 0,00',
                    valorEntrada: 'R$ 0,00',
                    previsaoEntrega: '',
                    horarioEntrega: '14:00'
                  });
                  setMostrarModalProposta(true);
                }}
                style={{ width: '100%', padding: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', marginBottom: '10px' }}
              >
                + Enviar Orçamento
              </button>
            )}

            {isCostureira && orcamentoAtual.status !== 'Cancelado' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => setMostrarModalProva(true)}
                  style={{ width: '100%', padding: '10px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  Agendar Prova da Peça
                </button>

                {(contratoAtivo || orcamentoAtual.status === 'Aberto') && (
                  <button
                    onClick={handleConcluirServico}
                    style={{ width: '100%', padding: '10px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    ✅ Concluir Peça (Pronto p/ Entrega)
                  </button>
                )}
              </div>
            )}

            {orcamentoAtual.status !== 'Cancelado' && orcamentoAtual.status !== 'Entregue' && (
              <button
                onClick={handleCancelarPedido}
                style={{ width: '100%', padding: '10px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', marginTop: '10px' }}
              >
                ❌ {isCostureira ? 'Cancelar / Desistir do Pedido' : 'Cancelar Pedido'}
              </button>
            )}

            <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleExportarPDF}
                style={{ width: '100%', padding: '9px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
              >
                📄 Exportar PDF (Contrato/Comprovante)
              </button>
              <button
                onClick={handleExportarTXT}
                style={{ width: '100%', padding: '9px', background: '#fff', color: '#555', border: '1px solid #ccc', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
              >
                📝 Baixar Ficha e Orçamento (TXT)
              </button>
            </div>

          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#3E2445', fontSize: '17px', fontWeight: 'bold' }}>Ficha de Medidas</h3>
              <button onClick={() => setMostrarModalMedidas(true)} style={{ background: 'none', border: 'none', color: '#3E2445', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                Editar
              </button>
            </div>

            <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '0 0 10px 0', fontSize: '13px', color: '#555' }}>
              <li>Busto: {medidas.busto || '-'} cm</li>
              <li>Cintura: {medidas.cintura || '-'} cm</li>
              <li>Quadril: {medidas.quadril || '-'} cm</li>
            </ul>

            {medidas.observacoes_medidas && (
              <div style={{ fontSize: '12px', color: '#666', background: '#FAF7FA', padding: '8px', borderRadius: '6px' }}>
                <strong>Obs:</strong> {medidas.observacoes_medidas}
              </div>
            )}
          </div>

        </div>

      </div>

      {mostrarModalProposta && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#3E2445' }}>Enviar Proposta de Orçamento</h3>
            <form onSubmit={handleEnviarProposta}>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Tipo de Serviço</label>
                <input
                  type="text"
                  value={propostaForm.tipoServico}
                  onChange={(e) => setPropostaForm({ ...propostaForm, tipoServico: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Descrição do Serviço</label>
                <textarea
                  rows="3"
                  value={propostaForm.descricao}
                  onChange={(e) => setPropostaForm({ ...propostaForm, descricao: e.target.value })}
                  placeholder="Ex: Ajustar 2cm de cintura e fazer barra original..."
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Valor Total (R$) *</label>
                <input
                  type="text"
                  value={propostaForm.valorTotal}
                  onChange={(e) => setPropostaForm({ ...propostaForm, valorTotal: mascararMoeda(e.target.value) })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Valor Entrada / Sinal (R$)</label>
                <input
                  type="text"
                  value={propostaForm.valorEntrada}
                  onChange={(e) => setPropostaForm({ ...propostaForm, valorEntrada: mascararMoeda(e.target.value) })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Data de Entrega *</label>
                  <input
                    type="date"
                    value={propostaForm.previsaoEntrega}
                    onChange={(e) => setPropostaForm({ ...propostaForm, previsaoEntrega: e.target.value })}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Horário Limite *</label>
                  <input
                    type="time"
                    value={propostaForm.horarioEntrega}
                    onChange={(e) => setPropostaForm({ ...propostaForm, horarioEntrega: e.target.value })}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setMostrarModalProposta(false)} style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '9px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Enviar Proposta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalProva && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#3E2445' }}>Agendar Prova da Peça</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!formProva.dataProva) return alert('Selecione uma data!');
              try {
                const res = await fetch('/api/ordens-servico/agendar-prova', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id_pedido: Number(idPedido),
                    id_costureira: Number(idUsuario),
                    dataProva: formProva.dataProva,
                    horarioProva: formProva.horarioProva,
                    semPreferenciaHorario: formProva.semPreferenciaHorario,
                    observacao: formProva.observacao
                  })
                });
                if (res.ok) {
                  alert('Prova agendada!');
                  setMostrarModalProva(false);
                  setOrcamentoAtual((prev) => ({ ...prev, status: 'Aguardando Prova' }));
                  carregarMensagens();
                }
              } catch (err) { alert(err.message); }
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Data da Prova *</label>
                <input
                  type="date"
                  value={formProva.dataProva}
                  onChange={(e) => setFormProva({ ...formProva, dataProva: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Horário da Prova</label>
                <input
                  type="time"
                  value={formProva.horarioProva}
                  disabled={formProva.semPreferenciaHorario}
                  onChange={(e) => setFormProva({ ...formProva, horarioProva: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', opacity: formProva.semPreferenciaHorario ? 0.5 : 1 }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={formProva.semPreferenciaHorario}
                    onChange={(e) => setFormProva({ ...formProva, semPreferenciaHorario: e.target.checked })}
                  />
                  Sem preferência / Horário a combinar
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Observações</label>
                <textarea
                  rows="3"
                  value={formProva.observacao}
                  onChange={(e) => setFormProva({ ...formProva, observacao: e.target.value })}
                  placeholder="Ex: Traga o sapato que usará com a peça..."
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setMostrarModalProva(false)} style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '9px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalMedidas && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#3E2445' }}>Editar Ficha de Medidas</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="Busto (cm)" value={medidas.busto} onChange={(e) => setMedidas({ ...medidas, busto: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="text" placeholder="Cintura (cm)" value={medidas.cintura} onChange={(e) => setMedidas({ ...medidas, cintura: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="text" placeholder="Quadril (cm)" value={medidas.quadril} onChange={(e) => setMedidas({ ...medidas, quadril: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <textarea placeholder="Outras medidas e observações" value={medidas.observacoes_medidas} onChange={(e) => setMedidas({ ...medidas, observacoes_medidas: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setMostrarModalMedidas(false)} style={{ padding: '8px 14px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="button" onClick={async () => {
                const targetId = idClientePedido || idUsuario;
                try {
                  const res = await fetch(`/api/usuarios/${targetId}/medidas`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(medidas)
                  });
                  if (res.ok) {
                    alert('Medidas salvas!');
                    setMostrarModalMedidas(false);
                  }
                } catch (err) { alert(err.message); }
              }} style={{ padding: '8px 14px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Salvar Medidas
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
*/