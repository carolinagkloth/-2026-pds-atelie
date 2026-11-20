import React, { useState, useEffect } from 'react';


const parsePrazoCliente = (prazoStr) => {

  if (!prazoStr) {
    return {
      dataMax: '',
      horarioMax: '',
      temHorarioFixo: false
    };
  }


  const str =
    String(prazoStr).trim();


  const matchData =
    str.match(
      /(\d{4}-\d{2}-\d{2})/
    );


  const dataMax =
    matchData
      ? matchData[1]
      : '';


  const matchHora =
    str.match(
      /\((\d{2}:\d{2})\)/
    );


  const horarioMax =
    matchHora
      ? matchHora[1]
      : '';


  return {
    dataMax,
    horarioMax,
    temHorarioFixo:
      Boolean(horarioMax)
  };

};


const formatarDataBR = (
  yyyyMmDd
) => {

  if (!yyyyMmDd) return '';


  const [
    ano,
    mes,
    dia
  ] =
    yyyyMmDd.split('-');


  return (
    ano &&
    mes &&
    dia
      ? `${dia}/${mes}/${ano}`
      : yyyyMmDd
  );

};


function ModalProposta({
  isOpen,
  onClose,
  onEnviar,
  descricaoInicial,
  tipoInicial,
  prazoDesejado
}) {

  const [
    tipoServico,
    setTipoServico
  ] =
    useState(
      tipoInicial ||
      'Ajuste / Conserto'
    );


  const [
    descricao,
    setDescricao
  ] =
    useState(
      descricaoInicial ||
      ''
    );


  const [
    valorTotal,
    setValorTotal
  ] =
    useState(
      'R$ 0,00'
    );


  const [
    valorEntrada,
    setValorEntrada
  ] =
    useState(
      'R$ 0,00'
    );


  const [
    previsaoEntrega,
    setPrevisaoEntrega
  ] =
    useState('');


  const [
    horarioEntrega,
    setHorarioEntrega
  ] =
    useState('14:00');


  const [erro, setErro] =
    useState('');


  const agora =
    new Date();


  const hoje =
    `${agora.getFullYear()}-${String(
      agora.getMonth() + 1
    ).padStart(2, '0')}-${String(
      agora.getDate()
    ).padStart(2, '0')}`;


  const {
    dataMax,
    horarioMax,
    temHorarioFixo
  } =
    parsePrazoCliente(
      prazoDesejado
    );


  const prazoClienteVencido =
    Boolean(
      dataMax &&
      dataMax < hoje
    );


  useEffect(() => {

    if (isOpen) {

      setTipoServico(
        tipoInicial ||
        'Ajuste / Conserto'
      );


      setDescricao(
        descricaoInicial ||
        ''
      );


      setValorTotal(
        'R$ 0,00'
      );


      setValorEntrada(
        'R$ 0,00'
      );


      setPrevisaoEntrega(
        dataMax &&
        dataMax >= hoje
          ? dataMax
          : ''
      );


      setHorarioEntrega(
        horarioMax ||
        '14:00'
      );


      setErro('');

    }

  }, [
    isOpen,
    tipoInicial,
    descricaoInicial,
    dataMax,
    horarioMax,
    hoje
  ]);


  if (!isOpen) {
    return null;
  }


  const mascararMoeda = (
    valorRaw
  ) => {

    let v =
      String(valorRaw)
        .replace(
          /\D/g,
          ''
        );


    if (!v) {
      return 'R$ 0,00';
    }


    v =
      (
        parseInt(
          v,
          10
        ) / 100
      )
        .toFixed(2)
        .replace(
          '.',
          ','
        )
        .replace(
          /(\d)(?=(\d{3})+(?!\d))/g,
          '$1.'
        );


    return `R$ ${v}`;

  };


  const handleDataChange = (
    novaData
  ) => {

    setPrevisaoEntrega(
      novaData
    );


    if (
      temHorarioFixo &&
      novaData === dataMax &&
      horarioEntrega >
        horarioMax
    ) {

      setHorarioEntrega(
        horarioMax
      );

    }

  };


  const handleSubmit = (e) => {

    e.preventDefault();

    setErro('');


    const totalNumerico =
      parseFloat(
        valorTotal
          .replace(
            /[^\d,]/g,
            ''
          )
          .replace(
            ',',
            '.'
          )
      ) || 0;


    if (
      totalNumerico <= 0
    ) {

      setErro(
        'Informe um valor total maior que R$ 0,00 para enviar o orçamento.'
      );

      return;

    }


    if (
      !previsaoEntrega ||
      !horarioEntrega
    ) {

      setErro(
        'A data e o horário limite de entrega são obrigatórios para formalizar a proposta.'
      );

      return;

    }


    if (
      !prazoClienteVencido &&
      dataMax &&
      previsaoEntrega >
        dataMax
    ) {

      setErro(
        `A data de entrega não pode ultrapassar o prazo solicitado pela cliente (${formatarDataBR(dataMax)}).`
      );

      return;

    }


    if (
      !prazoClienteVencido &&
      temHorarioFixo &&
      previsaoEntrega ===
        dataMax &&
      horarioEntrega >
        horarioMax
    ) {

      setErro(
        `Para entrega no dia ${formatarDataBR(dataMax)}, o horário limite solicitado pela cliente é até ${horarioMax}.`
      );

      return;

    }


    onEnviar({
      tipoServico,
      descricao,
      valorTotal,
      valorEntrada,
      previsaoEntrega,
      horarioEntrega
    });

  };


  const limiteHorarioAtivo =
    !prazoClienteVencido &&
    temHorarioFixo &&
    previsaoEntrega ===
      dataMax;


  return (

    <div
      style={{
        position: 'fixed',

        inset: 0,

        zIndex: 1100,

        display: 'flex',

        alignItems: 'center',
        justifyContent: 'center',

        padding: '18px',

        background:
          'rgba(43, 29, 40, 0.50)',

        backdropFilter:
          'blur(4px)'
      }}
    >

      <div
        style={{
          width:
            'min(500px, 100%)',

          maxHeight:
            '92vh',

          overflowY:
            'auto',

          padding:
            '25px',

          boxSizing:
            'border-box',

          background:
            '#FFFFFF',

          border:
            '1px solid #E8E0E4',

          borderRadius:
            '16px',

          boxShadow:
            '0 22px 60px rgba(43,29,40,0.22)',

          fontFamily:
            "'Poppins', 'Segoe UI', sans-serif"
        }}
      >


        {/* CABEÇALHO */}

        <div
          style={{
            marginBottom:
              '18px',

            paddingBottom:
              '15px',

            borderBottom:
              '1px solid #EEE7E3'
          }}
        >

          <span
            style={{
              display: 'block',

              marginBottom:
                '4px',

              color:
                '#BB91AD',

              fontSize:
                '8px',

              fontWeight:
                '700',

              letterSpacing:
                '1.1px',

              textTransform:
                'uppercase'
            }}
          >
            Negociação
          </span>


          <h3
            style={{
              margin: 0,

              color:
                '#3E2445',

              fontFamily:
                "'Playfair Display SC', 'Playfair Display', Georgia, serif",

              fontSize:
                '21px'
            }}
          >
            Enviar Proposta de Orçamento
          </h3>


          <p
            style={{
              margin:
                '6px 0 0',

              color:
                '#91858E',

              fontSize:
                '9px',

              lineHeight:
                '1.6'
            }}
          >
            Informe os valores e o prazo para formalizar sua proposta para a cliente.
          </p>

        </div>


        {/* PRAZO DA CLIENTE */}

        {dataMax && (

          <div
            style={{
              marginBottom:
                '17px',

              padding:
                '11px 12px',

              background:
                '#F8F3F6',

              color:
                '#675463',

              border:
                '1px solid #E4D7DF',

              borderLeft:
                '3px solid #917687',

              borderRadius:
                '8px',

              fontSize:
                '9px',

              lineHeight:
                '1.55'
            }}
          >

            <strong
              style={{
                color:
                  '#6E5568'
              }}
            >
              Prazo solicitado pela cliente:
            </strong>{' '}

            {formatarDataBR(
              dataMax
            )}

            {temHorarioFixo
              ? ` até às ${horarioMax}`
              : ' (horário a combinar)'
            }


            <span
              style={{
                display:
                  'block',

                marginTop:
                  '4px',

                color:
                  '#90858C'
              }}
            >
              {prazoClienteVencido
                ? 'A data original já passou; selecione a data mais próxima disponível.'
                : 'Você pode manter esse prazo ou adiantar a entrega.'
              }
            </span>

          </div>

        )}


        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* TIPO DE SERVIÇO */}

          <div
            style={{
              marginBottom:
                '14px'
            }}
          >

            <label
              style={{
                display:
                  'block',

                marginBottom:
                  '6px',

                color:
                  '#5F525C',

                fontSize:
                  '9px',

                fontWeight:
                  '600'
              }}
            >
              Tipo de Serviço
            </label>


            <input
              type="text"

              value={
                tipoServico
              }

              onChange={(e) =>
                setTipoServico(
                  e.target.value
                )
              }

              required

              style={{
                width:
                  '100%',

                height:
                  '41px',

                padding:
                  '0 12px',

                boxSizing:
                  'border-box',

                background:
                  '#FAF8F7',

                color:
                  '#4F474D',

                border:
                  '1px solid #DED6D1',

                borderRadius:
                  '8px',

                outline:
                  'none',

                fontFamily:
                  "'Poppins', sans-serif",

                fontSize:
                  '10px'
              }}
            />

          </div>


          {/* DESCRIÇÃO */}

          <div
            style={{
              marginBottom:
                '14px'
            }}
          >

            <label
              style={{
                display:
                  'block',

                marginBottom:
                  '6px',

                color:
                  '#5F525C',

                fontSize:
                  '9px',

                fontWeight:
                  '600'
              }}
            >
              Descrição do Serviço
            </label>


            <textarea
              rows="3"

              value={
                descricao
              }

              onChange={(e) =>
                setDescricao(
                  e.target.value
                )
              }

              required

              style={{
                width:
                  '100%',

                minHeight:
                  '92px',

                padding:
                  '10px 12px',

                boxSizing:
                  'border-box',

                resize:
                  'vertical',

                background:
                  '#FAF8F7',

                color:
                  '#4F474D',

                border:
                  '1px solid #DED6D1',

                borderRadius:
                  '8px',

                outline:
                  'none',

                fontFamily:
                  "'Poppins', sans-serif",

                fontSize:
                  '10px',

                lineHeight:
                  '1.6'
              }}
            />

          </div>


          {/* VALORES */}

          <div
            style={{
              display:
                'grid',

              gridTemplateColumns:
                '1fr 1fr',

              gap:
                '10px',

              marginBottom:
                '14px'
            }}
          >

            <div>

              <label
                style={{
                  display:
                    'block',

                  marginBottom:
                    '6px',

                  color:
                    '#5F525C',

                  fontSize:
                    '9px',

                  fontWeight:
                    '600'
                }}
              >
                Valor Total (R$) *
              </label>


              <input
                type="text"

                value={
                  valorTotal
                }

                onChange={(e) =>
                  setValorTotal(
                    mascararMoeda(
                      e.target.value
                    )
                  )
                }

                required

                style={{
                  width:
                    '100%',

                  height:
                    '41px',

                  padding:
                    '0 12px',

                  boxSizing:
                    'border-box',

                  background:
                    '#FAF8F7',

                  color:
                    '#4F474D',

                  border:
                    '1px solid #DED6D1',

                  borderRadius:
                    '8px',

                  outline:
                    'none',

                  fontFamily:
                    "'Poppins', sans-serif",

                  fontSize:
                    '10px'
                }}
              />

            </div>


            <div>

              <label
                style={{
                  display:
                    'block',

                  marginBottom:
                    '6px',

                  color:
                    '#5F525C',

                  fontSize:
                    '9px',

                  fontWeight:
                    '600'
                }}
              >
                Valor Entrada / Sinal (R$)
              </label>


              <input
                type="text"

                value={
                  valorEntrada
                }

                onChange={(e) =>
                  setValorEntrada(
                    mascararMoeda(
                      e.target.value
                    )
                  )
                }

                style={{
                  width:
                    '100%',

                  height:
                    '41px',

                  padding:
                    '0 12px',

                  boxSizing:
                    'border-box',

                  background:
                    '#FAF8F7',

                  color:
                    '#4F474D',

                  border:
                    '1px solid #DED6D1',

                  borderRadius:
                    '8px',

                  outline:
                    'none',

                  fontFamily:
                    "'Poppins', sans-serif",

                  fontSize:
                    '10px'
                }}
              />

            </div>

          </div>


          {/* DATA E HORÁRIO */}

          <div
            style={{
              display:
                'grid',

              gridTemplateColumns:
                '1fr 1fr',

              gap:
                '10px',

              marginBottom:
                '14px'
            }}
          >

            <div>

              <label
                style={{
                  display:
                    'block',

                  marginBottom:
                    '6px',

                  color:
                    '#5F525C',

                  fontSize:
                    '9px',

                  fontWeight:
                    '600'
                }}
              >
                Data Entrega *
              </label>


              <input
                type="date"

                min={hoje}

                max={
                  !prazoClienteVencido &&
                  dataMax
                    ? dataMax
                    : undefined
                }

                value={
                  previsaoEntrega
                }

                onChange={(e) =>
                  handleDataChange(
                    e.target.value
                  )
                }

                required

                style={{
                  width:
                    '100%',

                  height:
                    '41px',

                  padding:
                    '0 10px',

                  boxSizing:
                    'border-box',

                  background:
                    '#FAF8F7',

                  color:
                    '#4F474D',

                  border:
                    '1px solid #DED6D1',

                  borderRadius:
                    '8px',

                  outline:
                    'none',

                  fontFamily:
                    "'Poppins', sans-serif",

                  fontSize:
                    '10px'
                }}
              />

            </div>


            <div>

              <label
                style={{
                  display:
                    'block',

                  marginBottom:
                    '6px',

                  color:
                    '#5F525C',

                  fontSize:
                    '9px',

                  fontWeight:
                    '600'
                }}
              >
                Horário Limite *
              </label>


              <input
                type="time"

                max={
                  limiteHorarioAtivo
                    ? horarioMax
                    : undefined
                }

                value={
                  horarioEntrega
                }

                onChange={(e) =>
                  setHorarioEntrega(
                    e.target.value
                  )
                }

                required

                style={{
                  width:
                    '100%',

                  height:
                    '41px',

                  padding:
                    '0 10px',

                  boxSizing:
                    'border-box',

                  background:
                    '#FAF8F7',

                  color:
                    '#4F474D',

                  border:
                    '1px solid #DED6D1',

                  borderRadius:
                    '8px',

                  outline:
                    'none',

                  fontFamily:
                    "'Poppins', sans-serif",

                  fontSize:
                    '10px'
                }}
              />

            </div>

          </div>


          {/* ERRO */}

          {erro && (

            <div
              style={{
                marginBottom:
                  '14px',

                padding:
                  '9px 11px',

                background:
                  '#FFF1F1',

                color:
                  '#9B5D5D',

                border:
                  '1px solid #F0D6D6',

                borderRadius:
                  '7px',

                fontSize:
                  '9px',

                lineHeight:
                  '1.5'
              }}
            >
              {erro}
            </div>

          )}


          {/* BOTÕES */}

          <div
            style={{
              display:
                'flex',

              justifyContent:
                'flex-end',

              gap:
                '8px',

              marginTop:
                '19px',

              paddingTop:
                '16px',

              borderTop:
                '1px solid #EEE7E3'
            }}
          >

            <button
              type="button"

              onClick={
                onClose
              }

              style={{
                padding:
                  '10px 15px',

                background:
                  '#FFFFFF',

                color:
                  '#7A5B72',

                border:
                  '1px solid #D8CFD5',

                borderRadius:
                  '8px',

                fontFamily:
                  "'Poppins', sans-serif",

                fontSize:
                  '9px',

                fontWeight:
                  '600',

                cursor:
                  'pointer'
              }}
            >
              Cancelar
            </button>


            <button
              type="submit"

              style={{
                padding:
                  '10px 16px',

                background:
                  '#7A5B72',

                color:
                  '#FFFFFF',

                border:
                  'none',

                borderRadius:
                  '8px',

                fontFamily:
                  "'Poppins', sans-serif",

                fontSize:
                  '9px',

                fontWeight:
                  '700',

                cursor:
                  'pointer'
              }}
            >
              Enviar Proposta
            </button>

          </div>


        </form>

      </div>

    </div>

  );

}


export default ModalProposta;