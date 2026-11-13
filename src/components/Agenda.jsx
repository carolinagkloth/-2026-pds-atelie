import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const obterEstiloStatus = (status) => {
  const s = (status || '').toLowerCase();

  if (s === 'aberto' || s === 'disponível') {
    return { background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32' };
  }
  if (s === 'aguardando prova') {
    return { background: '#FFF3E0', border: '1px solid #FFCC80', color: '#E65100' };
  }
  if (s === 'em produção' || s === 'a fazer') {
    return { background: '#E3F2FD', border: '1px solid #90CAF9', color: '#1565C0' };
  }
  if (s === 'concluído') {
    return { background: '#E0F2F1', border: '1px solid #80CBC4', color: '#00695C' };
  }
  if (s === 'entregue') {
    return { background: '#F3E5F5', border: '1px solid #CE93D8', color: '#6A1B9A' };
  }
  if (s === 'cancelado') {
    return { background: '#FFEBEE', border: '1px solid #EF9A9A', color: '#C62828' };
  }

  return { background: '#F5F5F5', border: '1px solid #E0E0E0', color: '#616161' };
};

const extrairDetalhesPedido = (texto) => {
  if (!texto) {
    return { servico: '', localizacao: '', descricao: '' };
  }

  let servico = '';
  let localizacao = '';
  let descricao = texto;

  if (texto.includes('Localização:')) {
    const partes = texto.split('Localização:');
    servico = partes[0].replace(/[\[\]]/g, '').replace(/\s*-\s*$/, '').trim();

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
      servico = matchColchetes[1].trim();
      descricao = matchColchetes[2].trim();
    }
  }

  return { servico, localizacao, descricao };
};

function Agenda({ idUsuario, isCliente }) {
  const [eventosAgenda, setEventosAgenda] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());

  useEffect(() => {
    if (!idUsuario) return;
    fetch(`/api/usuarios/${idUsuario}/agenda`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEventosAgenda(data);
        }
      })
      .catch(() => {});
  }, [idUsuario]);

  const formatarDataIsoLocal = (dateObjOrStr) => {
    if (!dateObjOrStr) return '';
    if (typeof dateObjOrStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateObjOrStr)) {
      return dateObjOrStr.split('T')[0];
    }
    const d = new Date(dateObjOrStr);
    if (isNaN(d.getTime())) return '';
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  // Oculta cancelados e usa a data real de entrega quando o pedido já foi entregue
  const eventosAtivos = eventosAgenda
    .filter((ev) => (ev.status_kanban || '').toLowerCase() !== 'cancelado')
    .map((ev) => {
      const isEntregue = (ev.status_kanban || '').toLowerCase() === 'entregue';
      const dataEfetiva =
        ev.tipo_evento === 'entrega' && isEntregue && ev.data_entrega
          ? ev.data_entrega
          : ev.data_evento;

      return { ...ev, data_efetiva: dataEfetiva };
    });

  const dataSelIso = formatarDataIsoLocal(dataSelecionada);

  const eventosDoDia = eventosAtivos.filter((ev) => {
    const dataEv = formatarDataIsoLocal(ev.data_efetiva);
    return dataEv && dataEv === dataSelIso;
  });

  const renderMarcadoresCalendario = ({ date, view }) => {
    if (view !== 'month') return null;
    const diaIso = formatarDataIsoLocal(date);
    const temProva = eventosAtivos.some(
      (ev) => ev.tipo_evento === 'prova' && formatarDataIsoLocal(ev.data_efetiva) === diaIso
    );
    const temEntrega = eventosAtivos.some(
      (ev) => ev.tipo_evento === 'entrega' && formatarDataIsoLocal(ev.data_efetiva) === diaIso
    );

    if (!temProva && !temEntrega) return null;

    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginTop: '2px' }}>
        {temProva && (
          <span
            title="Prova"
            style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E67E22', display: 'inline-block' }}
          />
        )}
        {temEntrega && (
          <span
            title="Entrega"
            style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E7D32', display: 'inline-block' }}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ marginTop: '30px', borderTop: '2px solid #F4EFF5', paddingTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ color: '#3E2445', margin: 0, fontSize: '18px' }}>
          Agenda de Entregas e Provas
        </h3>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#555' }}>
          <span><strong style={{ color: '#E67E22' }}>●</strong> Prova</span>
          <span><strong style={{ color: '#2E7D32' }}>●</strong> Entrega</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '15px', alignItems: 'flex-start' }}>
        <Calendar
          onChange={setDataSelecionada}
          value={dataSelecionada}
          tileContent={renderMarcadoresCalendario}
        />

        <div style={{ flex: 1, minWidth: '280px', width: '100%' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#3E2445', fontSize: '15px' }}>
            Compromissos em {dataSelecionada.toLocaleDateString('pt-BR')}:
          </h4>

          {eventosDoDia.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
              Sem entregas ou provas previstas para esta data.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              {eventosDoDia.map((item) => {
                const isProva = item.tipo_evento === 'prova';
                const isEntregue = (item.status_kanban || '').toLowerCase() === 'entregue';
                const detalhes = extrairDetalhesPedido(item.pedido_descricao);
                const estiloStatus = obterEstiloStatus(item.status_kanban);

                const corBorda = isEntregue ? '#6A1B9A' : isProva ? '#E67E22' : '#2E7D32';
                const tituloEvento = isProva
                  ? isEntregue
                    ? `Prova Realizada ✓ ${item.horario_evento ? `(${item.horario_evento})` : ''}`
                    : `Prova Agendada 📅 ${item.horario_evento ? `(${item.horario_evento})` : ''}`
                  : isEntregue
                  ? 'Peça Entregue ✓'
                  : 'Previsão de Entrega 📦';

                return (
                  <div
                    key={item.id_evento}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: isEntregue ? '#FBF9FC' : '#F9F9F9',
                      border: '1px solid #EAE4EC',
                      borderLeft: `4px solid ${corBorda}`,
                      padding: '14px',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: corBorda, textTransform: 'uppercase' }}>
                        {tituloEvento}
                      </span>
                      {item.status_kanban && (
                        <span
                          style={{
                            background: estiloStatus.background,
                            border: estiloStatus.border,
                            color: estiloStatus.color,
                            padding: '2px 9px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        >
                          {item.status_kanban}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '14px', color: '#3E2445', fontWeight: 'bold', marginBottom: '8px' }}>
                      Pedido #{item.id_pedido}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#555' }}>
                      {detalhes.servico && (
                        <div><strong>Serviço:</strong> {detalhes.servico}</div>
                      )}
                      {detalhes.localizacao && (
                        <div><strong>Localização:</strong> {detalhes.localizacao}</div>
                      )}
                      {detalhes.descricao && (
                        <div style={{ whiteSpace: 'pre-line' }}><strong>Descrição:</strong> {detalhes.descricao}</div>
                      )}
                      <div>
                        <strong>{isCliente ? 'Costureira:' : 'Cliente:'}</strong>{' '}
                        {isCliente ? (item.costureira_nome || 'A definir') : (item.cliente_nome || 'Cliente')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Agenda;