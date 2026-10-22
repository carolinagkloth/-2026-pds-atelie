import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

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
      if (!response.ok) throw new Error(data.erro || 'Falha ao autenticar.');

      onLoginSucesso(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#3E2445', marginTop: 0 }}>Entrar no Ateliê</h2>

      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{erro}</div>}

      {/* Botão de Login do Google */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setErro('Erro ao comunicar com a conta Google.')}
          text="signin_with"
          shape="rectangular"
          locale="pt-BR"
        />
      </div>

      <div style={{ textAlign: 'center', color: '#888', margin: '15px 0', fontSize: '12px' }}>OU COM E-MAIL E SENHA</div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>E-mail *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Senha *</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>

        <button type="submit" disabled={carregando} style={{ width: '100%', padding: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: carregando ? 'not-allowed' : 'pointer' }}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <span style={{ color: '#666', cursor: 'pointer' }} onClick={() => onNavigate('recuperar-senha')}>Esqueceu a senha?</span>
        <span style={{ color: '#3E2445', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onNavigate('cadastro')}>Criar conta</span>
      </div>
    </div>
  );
}

export default Login;