import React, { useState } from 'react';
import "../styles/RedefinirSenha.css";

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

function RedefinirSenha({ onNavigate }) {
  // Salva o token da URL no estado na montagem inicial do componente
  const [token] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  });

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!token) {
      setErro('Link inválido ou expirado. Acesse pelo e-mail de segurança recebido.');
      return;
    }

    if (novaSenha.length < 8) {
      setErro('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas digitadas não coincidem.');
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch('/api/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao redefinir a senha.');
      }

      setSucesso('Senha alterada com sucesso! Redirecionando...');

      setTimeout(() => {
        if (onNavigate) {
          onNavigate('login');
        } else {
          window.location.href = '/';
        }
      }, 2000);

    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', background: '#ffffff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ color: '#3E2445', marginTop: 0, textAlign: 'center', fontSize: '22px', fontWeight: '600' }}>
        Nova Senha
      </h2>

      {!token && (
        <div style={{ background: '#FFF3CD', color: '#856404', padding: '12px 14px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', lineHeight: '1.4' }}>
          Para alterar sua senha com segurança, utilize o link enviado para o seu e-mail de notificação de acesso.
        </div>
      )}

      {erro && (
        <div style={{ background: '#FFEBEE', color: '#C62828', padding: '12px 14px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }}>
          {erro}
        </div>
      )}

      {sucesso && (
        <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '12px 14px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }}>
          {sucesso}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#3E2445' }}>
            Digite a Nova Senha *
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type={mostrarNovaSenha ? 'text' : 'password'} 
              value={novaSenha} 
              onChange={(e) => setNovaSenha(e.target.value)} 
              placeholder="Mínimo 8 caracteres"
              disabled={!token || carregando}
              required 
              style={{ width: '100%', padding: '10px 42px 10px 12px', borderRadius: '6px', border: '1px solid #CCC', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} 
            />
            <button
              type="button"
              onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
              disabled={!token}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              title={mostrarNovaSenha ? 'Ocultar senha' : 'Exibir senha'}
            >
              {mostrarNovaSenha ? <IconOlhoFechado /> : <IconOlhoAberto />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#3E2445' }}>
            Confirme a Nova Senha *
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type={mostrarConfirmarSenha ? 'text' : 'password'} 
              value={confirmarSenha} 
              onChange={(e) => setConfirmarSenha(e.target.value)} 
              placeholder="Repita a nova senha"
              disabled={!token || carregando}
              required 
              style={{ width: '100%', padding: '10px 42px 10px 12px', borderRadius: '6px', border: '1px solid #CCC', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} 
            />
            <button
              type="button"
              onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
              disabled={!token}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              title={mostrarConfirmarSenha ? 'Ocultar senha' : 'Exibir senha'}
            >
              {mostrarConfirmarSenha ? <IconOlhoFechado /> : <IconOlhoAberto />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={!token || carregando} 
          style={{ width: '100%', padding: '12px', background: '#3E2445', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: (!token || carregando) ? 'not-allowed' : 'pointer', opacity: (!token || carregando) ? 0.6 : 1, transition: 'background 0.2s' }}
        >
          {carregando ? 'Salvando...' : 'Redefinir Senha'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '18px' }}>
        <button
          type="button"
          onClick={() => onNavigate ? onNavigate('login') : (window.location.href = '/')}
          style={{ background: 'none', border: 'none', color: '#3E2445', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
        >
          Voltar para o Login
        </button>
      </div>
    </div>
  );
}

export default RedefinirSenha;