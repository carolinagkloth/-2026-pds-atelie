import React, { useEffect, useState } from 'react';


function Portfolio({
  idCostureira,
  modoEdicao = false
}) {

  /* ========================================
     ESTADOS
  ======================================== */

  const [itens, setItens] =
    useState([]);

  const [carregando, setCarregando] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const [erro, setErro] =
    useState('');


  const [titulo, setTitulo] =
    useState('');

  const [imagemBase64, setImagemBase64] =
    useState('');

  const [mostrarModalAdd, setMostrarModalAdd] =
    useState(false);


  /* ========================================
     CARREGAR PORTFÓLIO
  ======================================== */

  const carregarPortfolio = async () => {

    if (!idCostureira) {
      return;
    }


    try {

      const response =
        await fetch(
          `/api/portfolio/${idCostureira}`
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.erro ||
          'Erro ao carregar galeria.'
        );

      }


      setItens(
        Array.isArray(data)
          ? data
          : []
      );


    } catch (err) {

      setErro(
        err.message
      );

    } finally {

      setCarregando(false);

    }

  };


  useEffect(() => {

    carregarPortfolio();

  }, [idCostureira]);


  /* ========================================
     FOTO
  ======================================== */

  const handleFileChange = (e) => {

    const file =
      e.target.files[0];


    if (!file) {
      return;
    }


    const reader =
      new FileReader();


    reader.onloadend = () => {

      setImagemBase64(
        reader.result
      );

    };


    reader.readAsDataURL(file);

  };


  /* ========================================
     SALVAR
  ======================================== */

  const handleSalvar = async (e) => {

    e.preventDefault();


    if (!imagemBase64) {

      alert(
        'Selecione uma imagem para enviar.'
      );

      return;

    }


    setEnviando(true);


    try {

      const response =
        await fetch(
          '/api/portfolio',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                id_costureira:
                  idCostureira,

                url_imagem:
                  imagemBase64,

                titulo_trabalho:
                  titulo
              })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.erro ||
          'Erro ao salvar item.'
        );

      }


      setTitulo('');

      setImagemBase64('');

      setMostrarModalAdd(false);

      carregarPortfolio();


    } catch (err) {

      alert(
        `Erro: ${err.message}`
      );

    } finally {

      setEnviando(false);

    }

  };


  /* ========================================
     EXCLUIR
  ======================================== */

  const handleExcluir =
    async (idMidia) => {

      if (
        !window.confirm(
          'Deseja remover esta foto do seu portfólio?'
        )
      ) {
        return;
      }


      try {

        const response =
          await fetch(
            `/api/portfolio/${idMidia}`,
            {
              method:
                'DELETE'
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.erro ||
            'Erro ao excluir foto.'
          );

        }


        setItens(
          (prev) =>
            prev.filter(
              (item) =>
                item.id !==
                idMidia
            )
        );


      } catch (err) {

        alert(
          `Erro: ${err.message}`
        );

      }

    };


  /* ========================================
     RENDER
  ======================================== */

  return (

    <section style={secaoStyle}>


      {/* CABEÇALHO */}

      <div style={cabecalhoStyle}>

        <div>

          <span style={eyebrowStyle}>
            Meu trabalho
          </span>


          <h2 style={tituloStyle}>
            Portfólio
          </h2>


          <p style={subtituloStyle}>
            Trabalhos realizados anteriormente.
          </p>

        </div>


        {modoEdicao && (

          <button
            type="button"
            onClick={() =>
              setMostrarModalAdd(true)
            }
            style={botaoAdicionarStyle}
          >
            + Adicionar foto
          </button>

        )}

      </div>


      {/* CARREGANDO */}

      {carregando && (

        <div style={estadoVazioStyle}>

          <span style={estadoTextoStyle}>
            Carregando trabalhos...
          </span>

        </div>

      )}


      {/* ERRO */}

      {!carregando && erro && (

        <div style={erroStyle}>
          {erro}
        </div>

      )}


      {/* PORTFÓLIO VAZIO */}

      {!carregando &&
        !erro &&
        itens.length === 0 && (

        <div style={portfolioVazioStyle}>

          <div style={iconeVazioStyle}>
            ✂
          </div>


          <h3 style={tituloVazioStyle}>
            Seu portfólio ainda está vazio
          </h3>


          <p style={textoVazioStyle}>
            Os trabalhos cadastrados aparecerão aqui.
          </p>


          {modoEdicao && (

            <button
              type="button"
              onClick={() =>
                setMostrarModalAdd(true)
              }
              style={{
                ...botaoAdicionarStyle,
                marginTop:
                  '17px'
              }}
            >
              Adicionar primeiro trabalho
            </button>

          )}

        </div>

      )}


      {/* GRID */}

      {!carregando &&
        itens.length > 0 && (

        <div style={gridStyle}>

          {itens.map(
            (item) => (

              <article
                key={item.id}
                style={cardStyle}
              >

                <div style={imagemContainerStyle}>

                  <img
                    src={item.urlImagem}
                    alt={
                      item.tituloTrabalho ||
                      'Trabalho de costura'
                    }
                    style={imagemStyle}
                  />


                  {modoEdicao && (

                    <button
                      type="button"
                      onClick={() =>
                        handleExcluir(
                          item.id
                        )
                      }
                      style={botaoExcluirStyle}
                      title="Excluir foto"
                    >
                      ×
                    </button>

                  )}

                </div>


                <div style={cardConteudoStyle}>

                  <h3 style={cardTituloStyle}>
                    {
                      item.tituloTrabalho ||
                      'Trabalho realizado'
                    }
                  </h3>

                </div>

              </article>

            )
          )}

        </div>

      )}


      {/* ==================================
          MODAL
      ================================== */}

      {mostrarModalAdd && (

        <div style={overlayStyle}>

          <div style={modalStyle}>


            <div style={modalCabecalhoStyle}>

              <div>

                <span style={eyebrowStyle}>
                  Novo trabalho
                </span>


                <h3 style={modalTituloStyle}>
                  Publicar no portfólio
                </h3>

              </div>


              <button
                type="button"
                onClick={() =>
                  setMostrarModalAdd(false)
                }
                style={modalFecharStyle}
                aria-label="Fechar"
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSalvar}
            >

              <div style={campoStyle}>

                <label style={labelStyle}>
                  Título da peça
                </label>


                <input
                  type="text"
                  value={titulo}
                  onChange={(e) =>
                    setTitulo(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: Vestido de festa em cetim"
                  style={inputStyle}
                />

              </div>


              <div style={campoStyle}>

                <label style={labelStyle}>
                  Foto do trabalho
                </label>


                <label style={uploadStyle}>

                  <span style={uploadIconeStyle}>
                    +
                  </span>


                  <span style={uploadTituloStyle}>
                    Selecionar imagem
                  </span>


                  <span style={uploadTextoStyle}>
                    Escolha uma foto do trabalho realizado
                  </span>


                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleFileChange
                    }
                    style={{
                      display:
                        'none'
                    }}
                    required
                  />

                </label>

              </div>


              {imagemBase64 && (

                <div style={previewWrapperStyle}>

                  <span style={labelStyle}>
                    Prévia
                  </span>


                  <div style={previewStyle}>

                    <img
                      src={imagemBase64}
                      alt="Prévia"
                      style={previewImagemStyle}
                    />

                  </div>

                </div>

              )}


              <div style={acoesStyle}>

                <button
                  type="button"
                  onClick={() =>
                    setMostrarModalAdd(false)
                  }
                  style={botaoCancelarStyle}
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  disabled={enviando}
                  style={{
                    ...botaoAdicionarStyle,

                    opacity:
                      enviando
                        ? 0.65
                        : 1,

                    cursor:
                      enviando
                        ? 'not-allowed'
                        : 'pointer'
                  }}
                >
                  {
                    enviando
                      ? 'Publicando...'
                      : 'Publicar'
                  }
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </section>

  );

}


/* ========================================
   ESTILOS
======================================== */

const secaoStyle = {
  marginTop:
    '28px'
};


const cabecalhoStyle = {
  display:
    'flex',

  justifyContent:
    'space-between',

  alignItems:
    'flex-end',

  gap:
    '18px',

  marginBottom:
    '18px',

  flexWrap:
    'wrap'
};


const eyebrowStyle = {
  display:
    'block',

  marginBottom:
    '4px',

  color:
    '#917687',

  fontSize:
    '9px',

  fontWeight:
    '700',

  letterSpacing:
    '1px',

  textTransform:
    'uppercase'
};


const tituloStyle = {
  margin:
    0,

  color:
    '#3E2445',

  fontFamily:
    "'Playfair Display', Georgia, serif",

  fontSize:
    '25px'
};


const subtituloStyle = {
  margin:
    '5px 0 0',

  color:
    '#91858E',

  fontSize:
    '11px'
};


const botaoAdicionarStyle = {
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

  fontSize:
    '10px',

  fontWeight:
    '700',

  cursor:
    'pointer'
};


const estadoVazioStyle = {
  padding:
    '20px',

  background:
    '#FAF8F7',

  border:
    '1px dashed #D9CCD5',

  borderRadius:
    '10px'
};


const estadoTextoStyle = {
  color:
    '#92868E',

  fontSize:
    '10px'
};


const erroStyle = {
  padding:
    '12px 14px',

  background:
    '#FFF1F1',

  color:
    '#A43B3B',

  border:
    '1px solid #F1D5D5',

  borderRadius:
    '8px',

  fontSize:
    '10px'
};


const portfolioVazioStyle = {
  padding:
    '45px 25px',

  background:
    '#FFFFFF',

  border:
    '1px dashed #D9CCD5',

  borderRadius:
    '13px',

  textAlign:
    'center'
};


const iconeVazioStyle = {
  width:
    '43px',

  height:
    '43px',

  margin:
    '0 auto 11px',

  display:
    'flex',

  alignItems:
    'center',

  justifyContent:
    'center',

  background:
    '#F3ECEF',

  color:
    '#7A5B72',

  borderRadius:
    '50%',

  fontSize:
    '18px'
};


const tituloVazioStyle = {
  margin:
    '0 0 5px',

  color:
    '#3E2445',

  fontFamily:
    "'Playfair Display', Georgia, serif",

  fontSize:
    '17px'
};


const textoVazioStyle = {
  margin:
    0,

  color:
    '#91858E',

  fontSize:
    '10px'
};


const gridStyle = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',

  gap:
    '16px'
};


const cardStyle = {
  overflow:
    'hidden',

  background:
    '#FFFFFF',

  border:
    '1px solid #EBE5E0',

  borderRadius:
    '13px',

  boxShadow:
    '0 6px 18px rgba(62,36,69,0.04)'
};


const imagemContainerStyle = {
  position:
    'relative',

  height:
    '190px',

  overflow:
    'hidden',

  background:
    '#FAF8F7'
};


const imagemStyle = {
  width:
    '100%',

  height:
    '100%',

  objectFit:
    'cover',

  display:
    'block'
};


const botaoExcluirStyle = {
  position:
    'absolute',

  top:
    '9px',

  right:
    '9px',

  width:
    '28px',

  height:
    '28px',

  display:
    'flex',

  alignItems:
    'center',

  justifyContent:
    'center',

  padding:
    0,

  background:
    'rgba(255,255,255,0.94)',

  color:
    '#9C4B55',

  border:
    '1px solid #E7D9DB',

  borderRadius:
    '50%',

  boxShadow:
    '0 3px 10px rgba(62,36,69,0.12)',

  fontSize:
    '18px',

  lineHeight:
    1,

  cursor:
    'pointer'
};


const cardConteudoStyle = {
  padding:
    '15px 16px'
};


const cardTituloStyle = {
  margin:
    0,

  color:
    '#3E2445',

  fontFamily:
    "'Playfair Display', Georgia, serif",

  fontSize:
    '16px',

  fontWeight:
    '600'
};


const overlayStyle = {
  position:
    'fixed',

  inset:
    0,

  zIndex:
    1200,

  display:
    'flex',

  alignItems:
    'center',

  justifyContent:
    'center',

  padding:
    '20px',

  background:
    'rgba(42, 29, 40, 0.45)',

  backdropFilter:
    'blur(3px)'
};


const modalStyle = {
  width:
    'min(460px, 94vw)',

  maxHeight:
    '90vh',

  overflowY:
    'auto',

  padding:
    '24px',

  background:
    '#FFFFFF',

  border:
    '1px solid #EBE5E0',

  borderRadius:
    '15px',

  boxShadow:
    '0 20px 55px rgba(45,30,42,0.22)'
};


const modalCabecalhoStyle = {
  display:
    'flex',

  justifyContent:
    'space-between',

  alignItems:
    'flex-start',

  gap:
    '15px',

  marginBottom:
    '22px'
};


const modalTituloStyle = {
  margin:
    0,

  color:
    '#3E2445',

  fontFamily:
    "'Playfair Display', Georgia, serif",

  fontSize:
    '22px'
};


const modalFecharStyle = {
  width:
    '30px',

  height:
    '30px',

  display:
    'flex',

  alignItems:
    'center',

  justifyContent:
    'center',

  padding:
    0,

  background:
    '#FAF8F7',

  color:
    '#7A6875',

  border:
    '1px solid #E5DDDF',

  borderRadius:
    '50%',

  fontSize:
    '18px',

  cursor:
    'pointer'
};


const campoStyle = {
  marginBottom:
    '17px'
};


const labelStyle = {
  display:
    'block',

  marginBottom:
    '6px',

  color:
    '#5F525C',

  fontSize:
    '10px',

  fontWeight:
    '700'
};


const inputStyle = {
  width:
    '100%',

  padding:
    '11px 12px',

  boxSizing:
    'border-box',

  background:
    '#FFFFFF',

  color:
    '#4A424A',

  border:
    '1px solid #DED6D1',

  borderRadius:
    '8px',

  fontFamily:
    "'Plus Jakarta Sans', 'Segoe UI', sans-serif",

  fontSize:
    '11px',

  outline:
    'none'
};


const uploadStyle = {
  minHeight:
    '125px',

  display:
    'flex',

  flexDirection:
    'column',

  alignItems:
    'center',

  justifyContent:
    'center',

  padding:
    '20px',

  boxSizing:
    'border-box',

  background:
    '#FAF8F7',

  border:
    '1px dashed #D5C8D0',

  borderRadius:
    '10px',

  textAlign:
    'center',

  cursor:
    'pointer'
};


const uploadIconeStyle = {
  width:
    '32px',

  height:
    '32px',

  marginBottom:
    '8px',

  display:
    'flex',

  alignItems:
    'center',

  justifyContent:
    'center',

  background:
    '#F0E7EC',

  color:
    '#7A5B72',

  borderRadius:
    '50%',

  fontSize:
    '18px',

  fontWeight:
    '600'
};


const uploadTituloStyle = {
  color:
    '#625762',

  fontSize:
    '11px',

  fontWeight:
    '700'
};


const uploadTextoStyle = {
  marginTop:
    '4px',

  color:
    '#9A8E96',

  fontSize:
    '9px'
};


const previewWrapperStyle = {
  marginBottom:
    '18px'
};


const previewStyle = {
  height:
    '180px',

  overflow:
    'hidden',

  background:
    '#FAF8F7',

  border:
    '1px solid #EBE5E0',

  borderRadius:
    '10px'
};


const previewImagemStyle = {
  width:
    '100%',

  height:
    '100%',

  objectFit:
    'cover',

  display:
    'block'
};


const acoesStyle = {
  display:
    'flex',

  justifyContent:
    'flex-end',

  gap:
    '9px',

  marginTop:
    '22px',

  paddingTop:
    '18px',

  borderTop:
    '1px solid #EEE7E3'
};


const botaoCancelarStyle = {
  padding:
    '10px 16px',

  background:
    '#FFFFFF',

  color:
    '#6A5965',

  border:
    '1px solid #D8CFD5',

  borderRadius:
    '8px',

  fontSize:
    '10px',

  fontWeight:
    '700',

  cursor:
    'pointer'
};


export default Portfolio;