import React, { useState } from 'react';
import "../styles/Cadastro.css";

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
    <div className="cadastro-card">
      <h2>Criar Conta</h2>
      <p className="cadastro-subtitle">
        Crie sua conta no Ateliê Entre Linhas
      </p>

      {erro && (
        <div className="cadastro-erro">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="cadastro-form-group">
          <label>Nome Completo *</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>

        <div className="cadastro-form-group">
          <label>E-mail *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="cadastro-form-group">
          <label>Senha *</label>
          <input
            type="password"
            value={senha}
            minLength={8}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo de 8 caracteres"
            required/>
          <small className="cadastro-ajuda">
            A senha deve ter pelo menos 8 dígitos.
          </small>
        </div>

        <div className="cadastro-duas-colunas">

  <div className="cadastro-form-group">
    <label>Telefone</label>

    <input
      type="text"
      value={telefone}
      onChange={handleTelefoneChange}
      placeholder="(42) 99999-9999"
    />
  </div>

  <div className="cadastro-form-group">
    <label>CPF / CNPJ</label>

    <input
      type="text"
      value={cpfCnpj}
      onChange={handleCpfCnpjChange}
      placeholder="000.000.000-00"
    />
  </div>

</div>

<div className="cadastro-form-group">
  <label>Tipo de Perfil *</label>

  <select
    value={tipoUsuario}
    onChange={(e) => setTipoUsuario(e.target.value)}
  >
    <option value="Cliente">
      Cliente (Quero contratar serviços)
    </option>

    <option value="Costureira">
      Costureira (Quero oferecer serviços)
    </option>
  </select>
</div>

<button
  type="submit"
  disabled={carregando}
  className="cadastro-button"
>
  {carregando ? 'Cadastrando...' : 'Cadastrar'}
</button>
</form>

<p className="cadastro-login">
  Já tem uma conta?{' '}
  <span onClick={() => onNavigate('login')}>
    Entrar
  </span>
</p>

</div>
);
}

export default Cadastro;