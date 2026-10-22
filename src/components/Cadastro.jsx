import React, { useState } from 'react';

// Funções utilitárias de máscara
const aplicarMascaraTelefone = (valor) => {
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 11);
  if (apenasNumeros.length <= 10) {
    return apenasNumeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/(-\vert{}\s)$/, '');
  }
  return apenasNumeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
};

const aplicarMascaraCpfCnpj = (valor) => {
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 14);
  if (apenasNumeros.length <= 11) {
    return apenasNumeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2') .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return apenasNumeros
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2') .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

function Cadastro({ onNavigate, onCadastroSucesso }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('Cliente');
  const [erro, setErro] = useState('');
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

    // Validação de tamanho mínimo da senha no front-end
    if (senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 dígitos.');
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch('http://localhost:3000/api/cadastro', {
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

      alert('Cadastro realizado com sucesso!');
      onCadastroSucesso(data.usuario);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#3E2445', marginTop: 0 }}>Criar Conta</h2>

      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{erro}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Nome Completo *</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>E-mail *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Senha *</label>
          <input
            type="password"
            value={senha}
            minLength={8}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo de 8 caracteres"
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>A senha deve ter pelo menos 8 dígitos.</small>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Telefone</label>
            <input
              type="text"
              value={telefone}
              onChange={handleTelefoneChange}
              placeholder="(42) 99999-9999"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>CPF / CNPJ</label>
            <input
              type="text"
              value={cpfCnpj}
              onChange={handleCpfCnpjChange}
              placeholder="000.000.000-00"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Tipo de Perfil *</label>
          <select value={tipoUsuario} onChange={(e) => setTipoUsuario(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="Cliente">Cliente (Quero contratar serviços)</option>
            <option value="Costureira">Costureira (Quero oferecer serviços)</option>
          </select>
        </div>

        <button type="submit" disabled={carregando} style={{ width: '100%', padding: '10px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: carregando ? 'not-allowed' : 'pointer' }}>
          {carregando ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>

      <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
        Já tem uma conta? <span style={{ color: '#3E2445', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onNavigate('login')}>Entrar</span>
      </p>
    </div>
  );
}

export default Cadastro;