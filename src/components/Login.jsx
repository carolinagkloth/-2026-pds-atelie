import React, { useState } from 'react';

function Login({ onNavigate, onLoginSucesso }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !senha) {
      alert('Preencha e-mail e senha!');
      return;
    }

    // Simulação de login funcional (Na quinta-feira aqui entra a chamada à API Node.js)
    const tipoSimulado = email.includes('costureira') ? 'Costureira' : 'Cliente';
    const usuarioMock = {
      id: 1,
      nome: email.split('@')[0],
      email: email,
      tipo_usuario: tipoSimulado
    };

    onLoginSucesso(usuarioMock);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#3E2445', textAlign: 'center' }}>Acessar Conta</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>E-mail ou Telefone:</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemplo@email.com"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Senha:</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Sua senha"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Entrar
        </button>
      </form>

      <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
        <p>
          <a href="#recuperar" onClick={(e) => { e.preventDefault(); onNavigate('recuperar-senha'); }} style={{ color: '#7A5B72' }}>
            Esqueceu sua senha?
          </a>
        </p>
        <p>
          Não tem conta?{' '}
          <a href="#cadastro" onClick={(e) => { e.preventDefault(); onNavigate('cadastro'); }} style={{ color: '#3E2445', fontWeight: 'bold' }}>
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;