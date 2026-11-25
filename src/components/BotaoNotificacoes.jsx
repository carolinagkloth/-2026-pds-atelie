import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';


function BotaoNotificacoes({
  usuario,
  onNavigate
}) {

  const [
    notificacoes,
    setNotificacoes
  ] = useState([]);


  const [
    menuAberto,
    setMenuAberto
  ] = useState(false);


  const dropdownRef =
    useRef(null);


  const idUsuario =
    usuario?.id_usuario ||
    usuario?.id;


  /* ========================================
     CARREGAR NOTIFICAÇÕES
  ======================================== */

  const carregarNotificacoes =
    useCallback(() => {

      if (!idUsuario) {
        return;
      }


      fetch(
        `/api/notificacoes/usuario/${idUsuario}`
      )

        .then((res) =>
          res.json()
        )

        .then((data) => {

          if (
            Array.isArray(data)
          ) {

            setNotificacoes(
              data
            );

          }

        })

        .catch(() => {});

    }, [idUsuario]);


  /* ========================================
     ATUALIZAÇÃO AUTOMÁTICA
  ======================================== */

  useEffect(() => {

    if (!idUsuario) {
      return;
    }


    carregarNotificacoes();


    const interval =
      setInterval(
        carregarNotificacoes,
        10000
      );


    window.addEventListener(
      'notificacoesAtualizadas',
      carregarNotificacoes
    );


    return () => {

      clearInterval(
        interval
      );


      window.removeEventListener(
        'notificacoesAtualizadas',
        carregarNotificacoes
      );

    };

  }, [
    idUsuario,
    carregarNotificacoes
  ]);


  /* ========================================
     FECHAR AO CLICAR FORA
  ======================================== */

  useEffect(() => {

    const handleClickOutside =
      (event) => {

        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(
            event.target
          )
        ) {

          setMenuAberto(
            false
          );

        }

      };


    document.addEventListener(
      'mousedown',
      handleClickOutside
    );


    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );

  }, []);


  /* ========================================
     MARCAR TODAS COMO LIDAS
  ======================================== */

  const handleMarcarTodasLidas =
    async () => {

      try {

        await fetch(
          `/api/notificacoes/usuario/${idUsuario}/marcar-todas-lidas`,
          {
            method:
              'PUT'
          }
        );


        setNotificacoes(
          (prev) =>
            prev.map(
              (notificacao) => ({
                ...notificacao,
                lida:
                  true
              })
            )
        );

      } catch (err) {

        console.error(
          err
        );

      }

    };


  /* ========================================
     ABRIR NOTIFICAÇÃO
  ======================================== */

  const handleClicarNotificacao =
    async (notif) => {

      if (!notif.lida) {

        try {

          await fetch(
            `/api/notificacoes/${notif.id_notificacao}/lida`,
            {
              method:
                'PUT'
            }
          );


          setNotificacoes(
            (prev) =>
              prev.map(
                (n) =>
                  n.id_notificacao ===
                  notif.id_notificacao

                    ? {
                        ...n,
                        lida:
                          true
                      }

                    : n
              )
          );

        } catch (err) {

          console.error(
            err
          );

        }

      }


      if (
        notif.id_pedido &&
        onNavigate
      ) {

        setMenuAberto(
          false
        );


        onNavigate(
          'chat',
          {
            id:
              notif.id_pedido,

            id_pedido:
              notif.id_pedido
          }
        );

      }

    };


  const naoLidasCount =
    notificacoes.filter(
      (n) =>
        !n.lida
    ).length;


  /* ========================================
     DATA
  ======================================== */

  const formatarData =
    (valor) => {

      if (!valor) {
        return '';
      }


      const data =
        new Date(
          valor
        );


      if (
        isNaN(
          data.getTime()
        )
      ) {
        return '';
      }


      return data.toLocaleString(
        'pt-BR',
        {
          dateStyle:
            'short',

          timeStyle:
            'short'
        }
      );

    };


  return (

    <div
      ref={
        dropdownRef
      }

      style={{
        position:
          'relative',

        display:
          'inline-flex',

        zIndex:
          9999,

        overflow:
          'visible',

        fontFamily:
          "'Plus Jakarta Sans', 'Segoe UI', sans-serif"
      }}
    >


      {/* =====================================
          SININHO
      ====================================== */}

      <button
        type="button"

        onClick={() =>
          setMenuAberto(
            (prev) =>
              !prev
          )
        }

        title="Notificações"

        aria-label="Abrir notificações"

        style={{
          position:
            'relative',

          width:
            '40px',

          height:
            '40px',

          display:
            'flex',

          alignItems:
            'center',

          justifyContent:
            'center',

          padding:
            0,

          background:
            menuAberto
              ? '#F1DFE3'
              : '#FAF3F2',

          color:
            '#7A5B72',

          border:
            '1px solid #DFC9D1',

          borderRadius:
            '50%',

          outline:
            'none',

          cursor:
            'pointer',

          transition:
            'background 160ms ease, border-color 160ms ease'
        }}
      >

        <span
          aria-hidden="true"

          style={{
            fontSize:
              '17px',

            lineHeight:
              1
          }}
        >
          🔔
        </span>


        {naoLidasCount > 0 && (

          <span
            style={{
              position:
                'absolute',

              top:
                '-4px',

              right:
                '-4px',

              minWidth:
                '18px',

              height:
                '18px',

              padding:
                '0 5px',

              boxSizing:
                'border-box',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              background:
                '#9A5A62',

              color:
                '#FFFFFF',

              border:
                '2px solid #FFFFFF',

              borderRadius:
                '999px',

              fontSize:
                '8px',

              fontWeight:
                '700',

              lineHeight:
                1
            }}
          >
            {naoLidasCount > 9
              ? '9+'
              : naoLidasCount
            }
          </span>

        )}

      </button>


      {/* =====================================
          DROPDOWN
      ====================================== */}

      {menuAberto && (

        <div
          style={{
            position:
              'absolute',

            top:
              '49px',

            right:
              0,

            width:
              '360px',

            maxWidth:
              '90vw',

            overflow:
              'hidden',

            background:
              '#FFFFFF',

            border:
              '1px solid #E3D3D6',

            borderRadius:
              '14px',

            boxShadow:
              '0 18px 45px rgba(62,36,69,0.16)',

            zIndex:
              10000
          }}
        >


          {/* CABEÇALHO */}

          <div
            style={{
              padding:
                '15px 16px',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'space-between',

              gap:
                '12px',

              background:
                '#FAF3F2',

              borderBottom:
                '1px solid #E9DCDF'
            }}
          >

            <div>

              <span
                style={{
                  display:
                    'block',

                  marginBottom:
                    '2px',

                  color:
                    '#917687',

                  fontSize:
                    '7px',

                  fontWeight:
                    '700',

                  letterSpacing:
                    '1px',

                  textTransform:
                    'uppercase'
                }}
              >
                Seus avisos
              </span>


              <strong
                style={{
                  color:
                    '#3E2445',

                  fontFamily:
                    "'Playfair Display', Georgia, serif",

                  fontSize:
                    '16px'
                }}
              >
                Notificações
              </strong>

            </div>


            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  '10px'
              }}
            >

              {naoLidasCount > 0 && (

                <button
                  type="button"

                  onClick={
                    handleMarcarTodasLidas
                  }

                  style={{
                    padding:
                      0,

                    background:
                      'transparent',

                    color:
                      '#7A5B72',

                    border:
                      'none',

                    fontFamily:
                      "'Plus Jakarta Sans', sans-serif",

                    fontSize:
                      '8px',

                    fontWeight:
                      '700',

                    cursor:
                      'pointer',

                    textDecoration:
                      'underline'
                  }}
                >
                  Marcar como lidas
                </button>

              )}


              <button
                type="button"

                onClick={() => {

                  setMenuAberto(
                    false
                  );


                  if (onNavigate) {

                    onNavigate(
                      'configuracoesNotificacoes'
                    );

                  }

                }}

                title="Configurações de notificações"

                style={{
                  width:
                    '30px',

                  height:
                    '30px',

                  padding:
                    0,

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  background:
                    '#FFFFFF',

                  color:
                    '#7A5B72',

                  border:
                    '1px solid #DFC9D1',

                  borderRadius:
                    '8px',

                  cursor:
                    'pointer'
                }}
              >
                ⚙
              </button>

            </div>

          </div>


          {/* LISTA */}

          <div
            style={{
              maxHeight:
                '370px',

              overflowY:
                'auto'
            }}
          >

            {notificacoes.length === 0 ? (

              <div
                style={{
                  padding:
                    '34px 22px',

                  textAlign:
                    'center'
                }}
              >

                <div
                  style={{
                    width:
                      '38px',

                    height:
                      '38px',

                    margin:
                      '0 auto 9px',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',

                    background:
                      '#F1DFE3',

                    borderRadius:
                      '50%',

                    fontSize:
                      '15px'
                  }}
                >
                  🔔
                </div>


                <strong
                  style={{
                    display:
                      'block',

                    marginBottom:
                      '4px',

                    color:
                      '#4F3C49',

                    fontSize:
                      '10px'
                  }}
                >
                  Tudo em dia
                </strong>


                <span
                  style={{
                    color:
                      '#91858E',

                    fontSize:
                      '9px'
                  }}
                >
                  Nenhuma notificação por enquanto.
                </span>

              </div>

            ) : (

              notificacoes.map(
                (notificacao) => (

                  <button
                    type="button"

                    key={
                      notificacao.id_notificacao
                    }

                    onClick={() =>
                      handleClicarNotificacao(
                        notificacao
                      )
                    }

                    style={{
                      width:
                        '100%',

                      padding:
                        '13px 15px',

                      display:
                        'flex',

                      alignItems:
                        'flex-start',

                      gap:
                        '10px',

                      background:
                        notificacao.lida
                          ? '#FFFFFF'
                          : '#FCF6F8',

                      color:
                        '#4A424A',

                      border:
                        'none',

                      borderBottom:
                        '1px solid #EEE4E6',

                      textAlign:
                        'left',

                      cursor:
                        notificacao.id_pedido
                          ? 'pointer'
                          : 'default'
                    }}
                  >

                    <span
                      style={{
                        width:
                          '8px',

                        height:
                          '8px',

                        marginTop:
                          '5px',

                        flexShrink:
                          0,

                        display:
                          'block',

                        background:
                          notificacao.lida
                            ? '#D5C8CE'
                            : '#7A5B72',

                        borderRadius:
                          '50%'
                      }}
                    />


                    <div
                      style={{
                        minWidth:
                          0,

                        flex:
                          1
                      }}
                    >

                      <strong
                        style={{
                          display:
                            'block',

                          marginBottom:
                            '3px',

                          color:
                            '#4F3C49',

                          fontSize:
                            '10px',

                          fontWeight:
                            notificacao.lida
                              ? '600'
                              : '700'
                        }}
                      >
                        {
                          notificacao.titulo ||
                          'Notificação'
                        }
                      </strong>


                      <p
                        style={{
                          margin:
                            0,

                          color:
                            '#746A72',

                          fontSize:
                            '9px',

                          lineHeight:
                            '1.45'
                        }}
                      >
                        {
                          notificacao.mensagem
                        }
                      </p>


                      <span
                        style={{
                          display:
                            'block',

                          marginTop:
                            '5px',

                          color:
                            '#A0949C',

                          fontSize:
                            '8px'
                        }}
                      >
                        {
                          formatarData(
                            notificacao.data_criacao
                          )
                        }
                      </span>

                    </div>

                  </button>

                )
              )

            )}

          </div>


          {/* RODAPÉ */}

          <div
            style={{
              padding:
                '10px 13px',

              background:
                '#FAF8F7',

              borderTop:
                '1px solid #E9DCDF'
            }}
          >

            <button
              type="button"

              onClick={() => {

                setMenuAberto(
                  false
                );


                if (onNavigate) {

                  onNavigate(
                    'configuracoesNotificacoes'
                  );

                }

              }}

              style={{
                width:
                  '100%',

                minHeight:
                  '34px',

                background:
                  'transparent',

                color:
                  '#7A5B72',

                border:
                  'none',

                fontFamily:
                  "'Plus Jakarta Sans', sans-serif",

                fontSize:
                  '9px',

                fontWeight:
                  '700',

                cursor:
                  'pointer'
              }}
            >
              Gerenciar notificações
            </button>

          </div>

        </div>

      )}

    </div>

  );

}


export default BotaoNotificacoes;