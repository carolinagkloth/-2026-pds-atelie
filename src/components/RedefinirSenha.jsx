import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Extrai o token da URL ?token=XYZ
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem!');
      return;
    }

    if (!token) {
      setErro('Token inválido ou ausente na URL.');
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch('http://localhost:3000/api/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao redefinir a senha.');

      alert(data.mensagem);
      navigate('/login');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#3E2445', marginTop: 0 }}>Nova Senha</h2>

      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{erro}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Digite a Nova Senha *</label>
          <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Confirme a Nova Senha *</label>
          <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>

        <button type="submit" disabled={carregando} style={{ width: '100%', padding: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: carregando ? 'not-allowed' : 'pointer' }}>
          {carregando ? 'Salvando...' : 'Redefinir Senha'}
        </button>
      </form>
    </div>
  );
}

export default RedefinirSenha;