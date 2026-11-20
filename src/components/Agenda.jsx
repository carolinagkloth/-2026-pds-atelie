import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/Agenda.css';


const obterEstiloStatus = (status) => {
  const s = (status || '').toLowerCase();

  if (s === 'aberto' || s === 'disponível') {
    return {
      background: '#EEF5EE',
      border: '1px solid #D7E6D7',
      color: '#557255'
    };
  }

  if (s === 'aguardando prova') {
    return {
      background: '#FFF7EA',
      border: '1px solid #F0DFC0',
      color: '#9A7040'
    };
  }

  if (s === 'em produção' || s === 'a fazer') {
    return {
      background: '#EEF2F7',
      border: '1px solid #D8E0EA',
      color: '#5C6F85'
    };
  }

  if (s === 'concluído') {
    return {
      background: '#EDF6F3',
      border: '1px solid #D4E8E2',
      color: '#52766B'
    };
  }

  if (s === 'entregue') {
    return {
      background: '#F3ECEF',
      border: '1px solid #E1D4DC',
      color: '#7A5B72'
    };
  }

  if (s === 'cancelado') {
    return {
      background: '#FFF0F0',
      border: '1px solid #F0D6D6',
      color: '#9B5D5D'
    };
  }

  return {
    background: '#F5F2F3',
    border: '1px solid #E2DBDE',
    color: '#746A70'
  };
};


const extrairDetalhesPedido = (texto) => {
  if (!texto) {
    return {
      servico: '',
      localizacao: '',
      descricao: ''
    };
  }

  let servico = '';
  let localizacao = '';
  let descricao = texto;

  if (texto.includes('Localização:')) {
    const partes = texto.split('Localização:');

    servico = partes[0]
      .replace(/[\[\]]/g, '')
      .replace(/\s*-\s*$/, '')
      .trim();

    const resto = partes[1].trim();
    const quebraDupla = resto.indexOf('\n\n');

    if (quebraDupla !== -1) {
      localizacao = resto
        .substring(0, quebraDupla)
        .trim();

      descricao = resto
        .substring(quebraDupla)
        .trim();
    } else {
      const primeiraLinha = resto.split('\n')[0];

      localizacao = primeiraLinha.trim();

      descricao = resto
        .substring(primeiraLinha.length)
        .trim();
    }
  } else {
    const matchColchetes = texto.match(
      /^\[([^\]]+)\]\s*(?:-?\s*)([\s\S]*)$/
    );

    if (matchColchetes) {
      servico = matchColchetes[1].trim();
      descricao = matchColchetes[2].trim();
    }
  }

  return {
    servico,
    localizacao,
    descricao
  };
};


function Agenda({
  idUsuario,
  isCliente
}) {

  const [
    eventosAgenda,
    setEventosAgenda
  ] = useState([]);


  const [
    dataSelecionada,
    setDataSelecionada
  ] = useState(new Date());


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

    if (
      typeof dateObjOrStr === 'string' &&
      /^\d{4}-\d{2}-\d{2}/.test(dateObjOrStr)
    ) {
      return dateObjOrStr.split('T')[0];
    }

    const d = new Date(dateObjOrStr);

    if (isNaN(d.getTime())) {
      return '';
    }

    const ano = d.getFullYear();

    const mes = String(
      d.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      d.getDate()
    ).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  };


  // Oculta cancelados e usa a data real de entrega
  // quando o pedido já foi entregue
  const eventosAtivos = eventosAgenda
    .filter(
      (ev) =>
        (
          ev.status_kanban ||
          ''
        ).toLowerCase() !== 'cancelado'
    )
    .map((ev) => {
      const isEntregue =
        (
          ev.status_kanban ||
          ''
        ).toLowerCase() === 'entregue';

      const dataEfetiva =
        ev.tipo_evento === 'entrega' &&
        isEntregue &&
        ev.data_entrega
          ? ev.data_entrega
          : ev.data_evento;

      return {
        ...ev,
        data_efetiva: dataEfetiva
      };
    });


  const dataSelIso =
    formatarDataIsoLocal(
      dataSelecionada
    );


  const eventosDoDia =
    eventosAtivos.filter((ev) => {
      const dataEv =
        formatarDataIsoLocal(
          ev.data_efetiva
        );

      return (
        dataEv &&
        dataEv === dataSelIso
      );
    });


  const renderMarcadoresCalendario = ({
    date,
    view
  }) => {

    if (view !== 'month') {
      return null;
    }


    const diaIso =
      formatarDataIsoLocal(date);


    const temProva =
      eventosAtivos.some(
        (ev) =>
          ev.tipo_evento === 'prova' &&
          formatarDataIsoLocal(
            ev.data_efetiva
          ) === diaIso
      );


    const temEntrega =
      eventosAtivos.some(
        (ev) =>
          ev.tipo_evento === 'entrega' &&
          formatarDataIsoLocal(
            ev.data_efetiva
          ) === diaIso
      );


    if (
      !temProva &&
      !temEntrega
    ) {
      return null;
    }


    return (
      <div className="agenda-marcadores">

        {temProva && (
          <span
            title="Prova"
            className="agenda-marcador agenda-marcador-prova"
          />
        )}

        {temEntrega && (
          <span
            title="Entrega"
            className="agenda-marcador agenda-marcador-entrega"
          />
        )}

      </div>
    );
  };


  return (

    <section className="agenda">


      {/* CABEÇALHO */}

      <div className="agenda-header">

        <div>

          <span className="agenda-eyebrow">
            Organização
          </span>

          <h3>
            Agenda de Entregas e Provas
          </h3>

        </div>


        <div className="agenda-legenda">

          <span>
            <i className="agenda-legenda-prova" />
            Prova
          </span>

          <span>
            <i className="agenda-legenda-entrega" />
            Entrega
          </span>

        </div>

      </div>


      {/* CONTEÚDO */}

      <div className="agenda-conteudo">


        {/* CALENDÁRIO */}

        <div className="agenda-calendario-card">

          <Calendar
            onChange={
              setDataSelecionada
            }

            value={
              dataSelecionada
            }

            tileContent={
              renderMarcadoresCalendario
            }
          />

        </div>


        {/* COMPROMISSOS */}

        <div className="agenda-eventos">

          <div className="agenda-eventos-header">

            <span>
              Compromissos
            </span>

            <h4>
              {dataSelecionada
                .toLocaleDateString(
                  'pt-BR'
                )}
            </h4>

          </div>


          {eventosDoDia.length === 0 ? (

            <div className="agenda-vazia">

              <div className="agenda-vazia-icone">
                ○
              </div>

              <strong>
                Nenhum compromisso
              </strong>

              <p>
                Sem entregas ou provas previstas para esta data.
              </p>

            </div>

          ) : (

            <div className="agenda-lista">

              {eventosDoDia.map(
                (item) => {

                  const isProva =
                    item.tipo_evento ===
                    'prova';


                  const isEntregue =
                    (
                      item.status_kanban ||
                      ''
                    ).toLowerCase() ===
                    'entregue';


                  const detalhes =
                    extrairDetalhesPedido(
                      item.pedido_descricao
                    );


                  const estiloStatus =
                    obterEstiloStatus(
                      item.status_kanban
                    );


                  const corBorda =
                    isEntregue
                      ? '#917687'
                      : isProva
                        ? '#C39A66'
                        : '#71866F';


                  const tituloEvento =
                    isProva

                      ? isEntregue

                        ? `Prova Realizada ✓ ${
                            item.horario_evento
                              ? `(${item.horario_evento})`
                              : ''
                          }`

                        : `Prova Agendada 📅 ${
                            item.horario_evento
                              ? `(${item.horario_evento})`
                              : ''
                          }`

                      : isEntregue

                        ? 'Peça Entregue ✓'

                        : 'Previsão de Entrega 📦';


                  return (

                    <article
                      key={
                        item.id_evento
                      }

                      className="agenda-evento-card"

                      style={{
                        borderLeftColor:
                          corBorda
                      }}
                    >


                      <div className="agenda-evento-topo">

                        <span
                          className="agenda-evento-tipo"

                          style={{
                            color:
                              corBorda
                          }}
                        >
                          {tituloEvento}
                        </span>


                        {item.status_kanban && (

                          <span
                            className="agenda-status"

                            style={{
                              background:
                                estiloStatus.background,

                              border:
                                estiloStatus.border,

                              color:
                                estiloStatus.color
                            }}
                          >
                            {item.status_kanban}
                          </span>

                        )}

                      </div>


                      <div className="agenda-pedido-id">
                        Pedido #{item.id_pedido}
                      </div>


                      <div className="agenda-detalhes">

                        {detalhes.servico && (

                          <div>
                            <strong>
                              Serviço:
                            </strong>{' '}

                            {detalhes.servico}
                          </div>

                        )}


                        {detalhes.localizacao && (

                          <div>
                            <strong>
                              Localização:
                            </strong>{' '}

                            {detalhes.localizacao}
                          </div>

                        )}


                        {detalhes.descricao && (

                          <div
                            className="agenda-descricao"
                          >
                            <strong>
                              Descrição:
                            </strong>{' '}

                            {detalhes.descricao}
                          </div>

                        )}


                        <div>

                          <strong>
                            {isCliente
                              ? 'Costureira:'
                              : 'Cliente:'
                            }
                          </strong>{' '}

                          {isCliente
                            ? (
                                item.costureira_nome ||
                                'A definir'
                              )
                            : (
                                item.cliente_nome ||
                                'Cliente'
                              )
                          }

                        </div>

                      </div>

                    </article>

                  );

                }
              )}

            </div>

          )}

        </div>


      </div>

    </section>

  );

}


export default Agenda;