import React, { useState } from 'react';

function RecuperarSenha({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      alert('Informe o e-mail cadastrado!');
      return;
    }
    setEnviado(true);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#3E2445', textAlign: 'center' }}>Recuperar Senha</h2>

      {enviado ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'green', fontWeight: 'bold' }}>Instruções enviadas!</p>
          <p>Verifique a caixa de entrada do e-mail <strong>{email}</strong> para redefinir sua senha.</p>
          <button onClick={() => onNavigate('login')} style={{ padding: '8px 16px', backgroundColor: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
            Voltar para o Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '15px' }}>
            Digite o e-mail associado à sua conta para receber o link de redefinição.
          </p>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>E-mail:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Enviar Instruções
          </button>
        </form>
      )}

      {!enviado && (
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <a href="#login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} style={{ color: '#7A5B72', fontSize: '14px' }}>
            Voltar para o Login
          </a>
        </div>
      )}
    </div>
  );
}

export default RecuperarSenha;