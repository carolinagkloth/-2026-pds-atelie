import React, { useState } from 'react';

function RecuperarSenha({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');
    setCarregando(true);

    try {
      const response = await fetch('http://localhost:3000/api/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao solicitar recuperação.');

      setMensagem(data.mensagem);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#3E2445', marginTop: 0 }}>Recuperar Senha</h2>

      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{erro}</div>}
      {mensagem && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{mensagem}</div>}

      <form onSubmit={handleSubmit}>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
          Informe o e-mail cadastrado na sua conta para receber o link de redefinição de senha.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>E-mail *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>

        <button type="submit" disabled={carregando} style={{ width: '100%', padding: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: carregando ? 'not-allowed' : 'pointer' }}>
          {carregando ? 'Enviando...' : 'Enviar Link de Recuperação'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
        <span style={{ color: '#3E2445', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onNavigate('login')}>Voltar ao Login</span>
      </p>
    </div>
  );
}

export default RecuperarSenha;