export const formatarDataBR = (dataStr) => {
  if (!dataStr) return 'A combinar';
  
  if (typeof dataStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dataStr)) {
    const limpo = dataStr.split('T')[0];
    const [ano, mes, dia] = limpo.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return dataStr;
  
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

// Extrai Tipo de Serviço (sem colchetes), Localização e Descrição limpa
export const parsePedidoDescricao = (rawDesc, localizacaoPadrao = '') => {
  if (!rawDesc) return { tipo: 'Serviço', localizacao: localizacaoPadrao, descricao: '' };

  const tipoMatch = rawDesc.match(/^\[(.*?)\]/);
  const tipo = tipoMatch ? tipoMatch[1].trim() : 'Serviço';

  let localizacao = localizacaoPadrao;
  const locMatch = rawDesc.match(/Localização:\s*([^\n]+)/i);
  if (locMatch && locMatch[1]) {
    localizacao = locMatch[1].trim();
  }

  const limpa = rawDesc
    .replace(/^\[.*?\]\s*-\s*Localização:[^\n]*\n+/gi, '')
    .replace(/^\[.*?\]\s*(?:-?\s*)/, '')
    .trim();

  return { tipo, localizacao, descricao: limpa };
};

export const exportarTXT = ({ idPedido, orcamentoAtual, medidas, pedido, costureiraNome }) => {
  const info = parsePedidoDescricao(pedido?.descricao, pedido?.localizacao);
  const dataEntrega = formatarDataBR(orcamentoAtual.prazo);
  const nomeCostureiraExibir = costureiraNome || pedido?.costureiraNome || 'Não informada';

  const conteudo = `==================================================
ATELIÊ ENTRE LINHAS - FICHA DO PEDIDO #${idPedido}
==================================================
Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Status Atual: ${orcamentoAtual.status}

1. RESUMO DO SERVIÇO:
--------------------------------------------------
Tipo de Serviço: ${info.tipo}
Descrição: ${info.descricao}
Cliente: ${pedido?.clienteNome || 'Cliente'}
Costureira Responsável: ${nomeCostureiraExibir}

2. ORÇAMENTO & CONTRATO:
--------------------------------------------------
Valor Total: R$ ${Number(orcamentoAtual.total || 0).toFixed(2)}
Entrada / Sinal: R$ ${Number(orcamentoAtual.entrada || 0).toFixed(2)}
Previsão de Entrega: ${dataEntrega} ${orcamentoAtual.horarioEntrega ? `às ${orcamentoAtual.horarioEntrega}` : ''}

3. FICHA DE MEDIDAS:
--------------------------------------------------
Busto: ${medidas.busto || '-'} cm
Cintura: ${medidas.cintura || '-'} cm
Quadril: ${medidas.quadril || '-'} cm
Observações: ${medidas.observacoes_medidas || 'Nenhuma'}
==================================================`;

  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Pedido_${idPedido}_Ficha_EntreLinhas.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportarPDF = ({ idPedido, orcamentoAtual, medidas, pedido, costureiraNome }) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return alert('Por favor, permita pop-ups no navegador para gerar o PDF.');

  const info = parsePedidoDescricao(pedido?.descricao, pedido?.localizacao);
  const dataEntregaFormatada = formatarDataBR(orcamentoAtual.prazo);
  const nomeCostureiraExibir = costureiraNome || pedido?.costureiraNome || 'Não informada';

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
        .highlight { color: #3E2445; font-weight: bold; }
        .footer { text-align: center; font-size: 11px; color: #888; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">Ateliê Entre Linhas - Pedido #${idPedido}</h1>
          <small>Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</small>
        </div>
        <div class="status">Status: ${orcamentoAtual.status}</div>
      </div>

      <div class="box">
        <h3 class="box-title">Informações do Serviço</h3>
        <p><strong>Cliente:</strong> ${pedido?.clienteNome || 'Cliente'}</p>
        <p><strong>Costureira Responsável:</strong> <span class="highlight">${nomeCostureiraExibir}</span></p>
        <p><strong>Tipo de Serviço:</strong> ${info.tipo}</p>
        <p><strong>Detalhes:</strong> ${info.descricao}</p>
      </div>

      <div class="box">
        <h3 class="box-title">Orçamento & Contrato Formalizado</h3>
        <table>
          <tr><th>Costureira Responsável:</th><td class="highlight">${nomeCostureiraExibir}</td></tr>
          <tr><th>Valor Total:</th><td>R$ ${Number(orcamentoAtual.total || 0).toFixed(2)}</td></tr>
          <tr><th>Entrada / Sinal:</th><td>R$ ${Number(orcamentoAtual.entrada || 0).toFixed(2)}</td></tr>
          <tr><th>Data Limite de Entrega:</th><td class="highlight">${dataEntregaFormatada} ${orcamentoAtual.horarioEntrega ? `às ${orcamentoAtual.horarioEntrega}` : ''}</td></tr>
        </table>
      </div>

      <div class="box">
        <h3 class="box-title">Ficha de Medidas do Cliente</h3>
        <table>
          <tr><th>Busto:</th><td>${medidas.busto || '-'} cm</td></tr>
          <tr><th>Cintura:</th><td>${medidas.cintura || '-'} cm</td></tr>
          <tr><th>Quadril:</th><td>${medidas.quadril || '-'} cm</td></tr>
          <tr><th>Observações:</th><td>${medidas.observacoes_medidas || 'Nenhuma'}</td></tr>
        </table>
      </div>

      <div class="footer">
        <p>Ateliê Entre Linhas - Contrato e Comprovante de Serviço</p>
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