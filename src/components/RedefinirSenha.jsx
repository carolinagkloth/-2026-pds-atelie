import React, { useState } from 'react';
import "../styles/RedefinirSenha.css";


const IconOlhoAberto = () => (

  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#7A5B72"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >

    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />

    <circle
      cx="12"
      cy="12"
      r="3"
    />

  </svg>

);


const IconOlhoFechado = () => (

  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#7A5B72"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >

    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />

    <line
      x1="1"
      y1="1"
      x2="23"
      y2="23"
    />

  </svg>

);


function RedefinirSenha({
  onNavigate
}) {

  const [token] =
    useState(() => {

      const params =
        new URLSearchParams(
          window.location.search
        );


      return (
        params.get('token') ||
        ''
      );

    });


  const [
    novaSenha,
    setNovaSenha
  ] = useState('');


  const [
    confirmarSenha,
    setConfirmarSenha
  ] = useState('');


  const [
    mostrarNovaSenha,
    setMostrarNovaSenha
  ] = useState(false);


  const [
    mostrarConfirmarSenha,
    setMostrarConfirmarSenha
  ] = useState(false);


  const [erro, setErro] =
    useState('');


  const [sucesso, setSucesso] =
    useState('');


  const [
    carregando,
    setCarregando
  ] = useState(false);


  const handleSubmit = async (e) => {

    e.preventDefault();

    setErro('');
    setSucesso('');


    if (!token) {

      setErro(
        'Link inválido ou expirado. Acesse pelo e-mail de segurança recebido.'
      );

      return;

    }


    if (
      novaSenha.length < 8
    ) {

      setErro(
        'A nova senha deve ter no mínimo 8 caracteres.'
      );

      return;

    }


    if (
      novaSenha !==
      confirmarSenha
    ) {

      setErro(
        'As senhas digitadas não coincidem.'
      );

      return;

    }


    setCarregando(true);


    try {

      const response =
        await fetch(
          '/api/redefinir-senha',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                token,
                novaSenha
              })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.erro ||
          'Erro ao redefinir a senha.'
        );

      }


      setSucesso(
        'Senha alterada com sucesso! Redirecionando...'
      );


      setTimeout(() => {

        if (onNavigate) {

          onNavigate(
            'login'
          );

        } else {

          window.location.href =
            '/';

        }

      }, 2000);


    } catch (err) {

      setErro(
        err.message
      );

    } finally {

      setCarregando(false);

    }

  };


  const voltarLogin = () => {

    if (onNavigate) {

      onNavigate(
        'login'
      );

    } else {

      window.location.href =
        '/';

    }

  };


  return (

    <main className="redefinir-page">

      <section className="redefinir-card">


        <div className="redefinir-cabecalho">

          <span className="redefinir-etiqueta">
            Segurança da conta
          </span>


          <h1>
            Criar nova senha
          </h1>


          <p>
            Escolha uma nova senha para acessar
            novamente sua conta.
          </p>

        </div>


        {!token && (

          <div className="redefinir-aviso">

            Para alterar sua senha com segurança,
            utilize o link enviado para o seu
            e-mail de recuperação.

          </div>

        )}


        {erro && (

          <div className="redefinir-erro">
            {erro}
          </div>

        )}


        {sucesso && (

          <div className="redefinir-sucesso">
            {sucesso}
          </div>

        )}


        <form
          onSubmit={
            handleSubmit
          }
        >


          <div className="redefinir-form-group">

            <label>
              Nova senha *
            </label>


            <div className="redefinir-senha-box">

              <input
                type={
                  mostrarNovaSenha
                    ? 'text'
                    : 'password'
                }

                value={
                  novaSenha
                }

                onChange={(e) =>
                  setNovaSenha(
                    e.target.value
                  )
                }

                placeholder="Mínimo de 8 caracteres"

                disabled={
                  !token ||
                  carregando
                }

                autoComplete="new-password"

                required
              />


              <button
                type="button"

                className="redefinir-olho"

                onClick={() =>
                  setMostrarNovaSenha(
                    !mostrarNovaSenha
                  )
                }

                disabled={
                  !token
                }

                title={
                  mostrarNovaSenha
                    ? 'Ocultar senha'
                    : 'Exibir senha'
                }
              >

                {mostrarNovaSenha
                  ? <IconOlhoFechado />
                  : <IconOlhoAberto />
                }

              </button>

            </div>

          </div>


          <div className="redefinir-form-group">

            <label>
              Confirmar nova senha *
            </label>


            <div className="redefinir-senha-box">

              <input
                type={
                  mostrarConfirmarSenha
                    ? 'text'
                    : 'password'
                }

                value={
                  confirmarSenha
                }

                onChange={(e) =>
                  setConfirmarSenha(
                    e.target.value
                  )
                }

                placeholder="Repita a nova senha"

                disabled={
                  !token ||
                  carregando
                }

                autoComplete="new-password"

                required
              />


              <button
                type="button"

                className="redefinir-olho"

                onClick={() =>
                  setMostrarConfirmarSenha(
                    !mostrarConfirmarSenha
                  )
                }

                disabled={
                  !token
                }

                title={
                  mostrarConfirmarSenha
                    ? 'Ocultar senha'
                    : 'Exibir senha'
                }
              >

                {mostrarConfirmarSenha
                  ? <IconOlhoFechado />
                  : <IconOlhoAberto />
                }

              </button>

            </div>

          </div>


          <button
            type="submit"

            className="redefinir-button"

            disabled={
              !token ||
              carregando
            }
          >
            {carregando
              ? 'Salvando...'
              : 'Redefinir senha'
            }
          </button>

        </form>


        <button
          type="button"

          className="redefinir-voltar"

          onClick={
            voltarLogin
          }
        >
          ← Voltar para o login
        </button>

      </section>

    </main>

  );

}


export default RedefinirSenha;