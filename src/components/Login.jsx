import React, { useState } from 'react';
import {
  GoogleLogin,
  GoogleOAuthProvider
} from '@react-oauth/google';

import '../styles/Login.css';
import bannerAtelie from '../assets/banner-atelie.svg';


const IconOlhoAberto = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#917687"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);


const IconOlhoFechado = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#917687"
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


function LoginContent({
  onNavigate,
  onLoginSucesso
}) {

  const [email, setEmail] =
    useState('');

  const [senha, setSenha] =
    useState('');

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [erro, setErro] =
    useState('');

  const [carregando, setCarregando] =
    useState(false);


  /* ========================================
     GOOGLE
     BACKEND ATUAL DA CAROLINA
  ======================================== */

  const handleGoogleSuccess =
    async (credentialResponse) => {

      setErro('');
      setCarregando(true);


      try {

        const response =
          await fetch(
            '/api/auth/google',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  token:
                    credentialResponse.credential
                })
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.erro ||
            'Falha na autenticação via Google.'
          );

        }


        /*
          Mantém a lógica NOVA da Carolina:
          usuário Google novo vai para cadastro.
        */

        if (data.novoUsuario) {

          if (onNavigate) {

            onNavigate(
              'cadastro',
              data.dadosGoogle
            );

          }

        } else {

          onLoginSucesso(data);

        }


      } catch (err) {

        setErro(err.message);

      } finally {

        setCarregando(false);

      }

    };


  /* ========================================
     LOGIN E-MAIL
     BACKEND ATUAL
  ======================================== */

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setErro('');
      setCarregando(true);


      try {

        const response =
          await fetch(
            '/api/login',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  email,
                  senha
                })
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.erro ||
            'Falha ao autenticar.'
          );

        }


        onLoginSucesso(data);


      } catch (err) {

        setErro(err.message);

      } finally {

        setCarregando(false);

      }

    };


  return (

    <div className="login-page">


      {/* BANNER ORIGINAL */}

      <section className="login-banner">

        <img
          src={bannerAtelie}
          alt="Banner Ateliê Entre Linhas"
        />

      </section>


      {/* LOGIN */}

      <main className="login-area">

        <div className="login-card">


          <div className="login-cabecalho">

            <span className="login-etiqueta">
              Bem-vindo de volta
            </span>


            <h1>
              Entre na sua conta
            </h1>


            <p className="login-subtitle">
              Acesse o Ateliê Entre Linhas e
              continue seus pedidos, projetos e
              negociações.
            </p>

          </div>


          {erro && (

            <div className="login-erro">
              {erro}
            </div>

          )}


          {/* GOOGLE */}

          <div className="login-google">

            <GoogleLogin
              onSuccess={
                handleGoogleSuccess
              }

              onError={() =>
                setErro(
                  'Erro ao comunicar com a conta Google.'
                )
              }

              text="signin_with"
              shape="rectangular"
              locale="pt-BR"
            />

          </div>


          <div className="login-separador">

            <span>
              ou entre com e-mail
            </span>

          </div>


          {/* FORMULÁRIO */}

          <form
            onSubmit={handleSubmit}
          >


            <div className="login-form-group">

              <label>
                E-mail
              </label>


              <input
                type="email"
                value={email}

                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }

                placeholder="seuemail@exemplo.com"

                autoComplete="email"

                required
              />

            </div>


            <div className="login-form-group">

              <label>
                Senha
              </label>


              <div className="login-senha-box">

                <input
                  type={
                    mostrarSenha
                      ? 'text'
                      : 'password'
                  }

                  value={senha}

                  onChange={(e) =>
                    setSenha(
                      e.target.value
                    )
                  }

                  placeholder="Sua senha"

                  autoComplete="current-password"

                  required
                />


                <button
                  type="button"

                  className="login-olho"

                  onClick={() =>
                    setMostrarSenha(
                      !mostrarSenha
                    )
                  }

                  title={
                    mostrarSenha
                      ? 'Ocultar senha'
                      : 'Exibir senha'
                  }
                >

                  {
                    mostrarSenha
                      ? <IconOlhoFechado />
                      : <IconOlhoAberto />
                  }

                </button>

              </div>

            </div>


            <div className="login-esqueci-area">

              <button
                type="button"

                className="login-link-texto"

                onClick={() =>
                  onNavigate &&
                  onNavigate(
                    'recuperarSenha'
                  )
                }
              >
                Esqueceu sua senha?
              </button>

            </div>


            <button
              type="submit"

              className="login-button"

              disabled={carregando}
            >
              {
                carregando
                  ? 'Entrando...'
                  : 'Entrar'
              }
            </button>

          </form>


          <div className="login-criar-conta">

            <span>
              Ainda não possui uma conta?
            </span>


            <button
              type="button"

              onClick={() =>
                onNavigate &&
                onNavigate(
                  'cadastro'
                )
              }
            >
              Criar uma conta
            </button>

          </div>


        </div>

      </main>

    </div>

  );

}


export default function Login(
  props
) {

  const clientId =
    import.meta.env
      .VITE_GOOGLE_CLIENT_ID ||
    '';


  return (

    <GoogleOAuthProvider
      clientId={clientId}
    >

      <LoginContent
        {...props}
      />

    </GoogleOAuthProvider>

  );

}