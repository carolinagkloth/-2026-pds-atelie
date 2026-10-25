import React, { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import "../styles/Login.css";

// Ícones Vetoriais SVG
const IconOlhoAberto = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3E2445" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconOlhoFechado = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3E2445" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function LoginContent({ onNavigate, onLoginSucesso }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Manipula a resposta de sucesso do Google OAuth
  const handleGoogleSuccess = async (credentialResponse) => {
    setErro('');
    setCarregando(true);

    try {
      const response = await fetch('/api/auth/google', {
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
      const response = await fetch('/api/login', {
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
    <div style={{ maxWidth: '400px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ color: '#3E2445', marginTop: 0, textAlign: 'center', fontSize: '22px' }}>Entrar no Ateliê</h2>

      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{erro}</div>}

      {/* Botão de Login do Google */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
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

      <div style={{ textAlign: 'center', color: '#888', margin: '15px 0', fontSize: '12px', fontWeight: 'bold' }}>OU COM E-MAIL E SENHA</div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#3E2445' }}>E-mail *</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#3E2445' }}>Senha *</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={mostrarSenha ? 'text' : 'password'} 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px 42px 10px 10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} 
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
            >
              {mostrarSenha ? <IconOlhoFechado /> : <IconOlhoAberto />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={carregando} 
          style={{ width: '100%', padding: '12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: carregando ? 'not-allowed' : 'pointer' }}
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

      </form>

      <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <span style={{ color: '#666', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onNavigate('recuperarSenha')}>Esqueceu a senha?</span>
        <span style={{ color: '#3E2445', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onNavigate('cadastro')}>Criar conta</span>
      </div>

    </div>
  );
}

export default function Login(props) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginContent {...props} />
    </GoogleOAuthProvider>
  );
}