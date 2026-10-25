import React, { useState } from 'react';
import "../styles/Cadastro.css";

// Ícones Vetoriais SVG para exibir/ocultar senha
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

// Funções utilitárias de máscara
const aplicarMascaraTelefone = (valor) => {
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 11);
  if (apenasNumeros.length <= 10) {
    return apenasNumeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  }
  return apenasNumeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
};

const aplicarMascaraCpfCnpj = (valor) => {
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 14);
  if (apenasNumeros.length <= 11) {
    return apenasNumeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return apenasNumeros
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

function Cadastro({ onNavigate, onCadastroSucesso }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('Cliente');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleTelefoneChange = (e) => {
    setTelefone(aplicarMascaraTelefone(e.target.value));
  };

  const handleCpfCnpjChange = (e) => {
    setCpfCnpj(aplicarMascaraCpfCnpj(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    // Validação de tamanho mínimo da senha no front-end
    if (senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 dígitos.');
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          senha,
          telefone,
          cpf_cnpj: cpfCnpj,
          tipo_usuario: tipoUsuario
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao realizar cadastro.');
      }

      setSucesso('Cadastro realizado com sucesso!');

      setTimeout(() => {
        if (onCadastroSucesso) {
          onCadastroSucesso(data.usuario);
        } else if (onNavigate) {
          onNavigate('login');
        }
      }, 1500);

    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ color: '#3E2445', marginTop: 0, textAlign: 'center', fontSize: '22px' }}>Criar Conta</h2>

      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{erro}</div>}
      {sucesso && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 14px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{sucesso}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#3E2445' }}>Nome Completo *</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#3E2445' }}>E-mail *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#3E2445' }}>Senha *</label>
          <div style={{ position: 'relative' }}>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              minLength={8}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
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
          <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>A senha deve ter pelo menos 8 dígitos.</small>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#3E2445' }}>Telefone</label>
            <input
              type="text"
              value={telefone}
              onChange={handleTelefoneChange}
              placeholder="(42) 99999-9999"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#3E2445' }}>CPF / CNPJ</label>
            <input
              type="text"
              value={cpfCnpj}
              onChange={handleCpfCnpjChange}
              placeholder="000.000.000-00"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#3E2445' }}>Tipo de Perfil *</label>
          <select value={tipoUsuario} onChange={(e) => setTipoUsuario(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', outline: 'none' }}>
            <option value="Cliente">Cliente (Quero contratar serviços)</option>
            <option value="Costureira">Costureira (Quero oferecer serviços)</option>
          </select>
        </div>

        <button type="submit" disabled={carregando} style={{ width: '100%', padding: '12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: carregando ? 'not-allowed' : 'pointer' }}>
          {carregando ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>

      <p style={{ marginTop: '18px', textAlign: 'center', fontSize: '13px' }}>
        Já tem uma conta? <span style={{ color: '#3E2445', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onNavigate('login')}>Entrar</span>
      </p>
    </div>
  );
}

export default Cadastro;