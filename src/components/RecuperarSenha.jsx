import React, { useState } from 'react';
import "../styles/RecuperarSenha.css";


function RecuperarSenha({ onNavigate }) {

  const [email, setEmail] =
    useState('');

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] =
    useState('');

  const [sucesso, setSucesso] =
    useState(false);


  const handleSubmit = async (e) => {

    e.preventDefault();

    setErro('');
    setCarregando(true);


    try {

      const response =
        await fetch(
          '/api/recuperar-senha',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                email:
                  email.trim()
              })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.erro ||
          'Erro ao solicitar recuperação.'
        );

      }


      setSucesso(true);

    } catch (err) {

      setErro(
        err.message
      );

    } finally {

      setCarregando(false);

    }

  };


  return (

    <main className="recuperar-page">

      <section className="recuperar-card">


        <div className="recuperar-cabecalho">

          <span className="recuperar-etiqueta">
            Segurança da conta
          </span>


          <h1>
            Recuperar senha
          </h1>


          <p>
            Informe o e-mail cadastrado.
            Enviaremos um link seguro para você
            criar uma nova senha.
          </p>

        </div>


        {erro && (

          <div className="recuperar-erro">
            {erro}
          </div>

        )}


        {sucesso ? (

          <div className="recuperar-sucesso">

            <div className="recuperar-sucesso-icone">
              ✓
            </div>


            <h2>
              Confira seu e-mail
            </h2>


            <div className="recuperar-sucesso-box">

              Enviamos as instruções para

              {' '}

              <strong>
                {email}
              </strong>.

            </div>


            <p>
              Verifique sua caixa de entrada e
              clique no link recebido para
              redefinir sua senha.
            </p>


            <button
              type="button"

              className="recuperar-button"

              onClick={() =>
                onNavigate &&
                onNavigate(
                  'login'
                )
              }
            >
              Voltar para o login
            </button>

          </div>

        ) : (

          <form
            onSubmit={
              handleSubmit
            }
          >

            <div className="recuperar-form-group">

              <label>
                E-mail *
              </label>


              <input
                type="email"

                value={email}

                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }

                placeholder="seu.email@exemplo.com"

                autoComplete="email"

                required
              />

            </div>


            <button
              type="submit"

              className="recuperar-button"

              disabled={
                carregando
              }
            >
              {carregando
                ? 'Verificando...'
                : 'Enviar instruções'
              }
            </button>


            <button
              type="button"

              className="recuperar-voltar"

              onClick={() =>
                onNavigate &&
                onNavigate(
                  'login'
                )
              }
            >
              ← Voltar para o login
            </button>

          </form>

        )}

      </section>

    </main>

  );

}


export default RecuperarSenha;