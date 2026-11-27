import React, { useState } from 'react';
import "../styles/RecuperarSenha.css";

function RecuperarSenha({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const response = await fetch('/api/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao solicitar recuperação.');
      }

      setSucesso(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ color: '#3E2445', marginTop: 0, textAlign: 'center', fontSize: '22px' }}>Recuperar Senha</h2>

      {erro && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
          {erro}
        </div>
      )}

      {sucesso ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '12px 14px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
            Enviamos as instruções para o e-mail <strong>{email}</strong>!
          </div>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
            Verifique sua caixa de entrada e clique no link recebido para redefinir sua senha.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            style={{ width: '100%', padding: '12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
          >
            Voltar para o Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px', lineHeight: '1.4' }}>
            Digite o e-mail cadastrado em sua conta. Enviaremos um link seguro para você criar uma nova senha.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#3E2445' }}>E-mail *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            style={{ width: '100%', padding: '12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: carregando ? 'not-allowed' : 'pointer' }}
          >
            {carregando ? 'Verificando...' : 'Enviar Instruções'}
          </button>
        </form>
      )}

      {!sucesso && (
        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <span
            onClick={() => onNavigate('login')}
            style={{ color: '#3E2445', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
          >
            Voltar para o Login
          </span>
        </div>
      )}
    </div>
  );
}

export default RecuperarSenha;