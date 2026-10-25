import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import "../styles/Login.css";

function Login({ onNavigate, onLoginSucesso }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Manipula a resposta de sucesso do Google OAuth
  const handleGoogleSuccess = async (credentialResponse) => {
    setErro('');
    setCarregando(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Falha na autenticação via Google.');
      }

      onLoginSucesso(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Falha ao autenticar.');
      }

      onLoginSucesso(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-card">

      <h2>Entrar no Ateliê</h2>

      <p className="login-subtitle">
        Acesse sua conta no Ateliê Entre Linhas
      </p>

      {erro && (
        <div className="login-erro">
          {erro}
        </div>
      )}

      {/* Botão de Login do Google */}
      <div className="login-google">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() =>
            setErro('Erro ao comunicar com a conta Google.')
          }
          text="signin_with"
          shape="rectangular"
          locale="pt-BR"
        />
      </div>

      <div className="login-separador">
        OU COM E-MAIL E SENHA
      </div>

      <form onSubmit={handleSubmit}>

        <div className="login-form-group">
          <label>E-mail *</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="login-form-group">
          <label>Senha *</label>

          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="login-button"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

      </form>

      <div className="login-links">

        <span
          style={{ color: '#666', cursor: 'pointer' }}
          onClick={() => onNavigate('recuperarSenha')}
        >
          Esqueceu a senha?
        </span>

        <span
          className="criar-conta"
          onClick={() => onNavigate('cadastro')}
        >
          Criar conta
        </span>

      </div>

    </div>
  );
}

export default Login;