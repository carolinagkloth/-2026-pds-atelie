import React, { useState } from 'react';

function Cadastro({ onNavigate, onCadastroSucesso }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    tipo_usuario: 'Cliente',
    cpf_cnpj: '',
    endereco: '',
    especialidades: '',
    bio: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.senha) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    // Simulação de cadastro bem-sucedido
    alert('Cadastro realizado com sucesso!');
    onCadastroSucesso({
      id: Date.now(),
      nome: formData.nome,
      email: formData.email,
      tipo_usuario: formData.tipo_usuario
    });
  };

  return (
    <div style={{ maxWidth: '500px', margin: '30px auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#3E2445', textAlign: 'center' }}>Criar Nova Conta</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Eu sou:</label>
          <select name="tipo_usuario" value={formData.tipo_usuario} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
            <option value="Cliente">Cliente (Quero contratar serviços)</option>
            <option value="Costureira">Costureira / Alfaiata (Quero oferecer serviços)</option>
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block' }}>Nome Completo *</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block' }}>E-mail *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block' }}>Senha *</label>
          <input type="password" name="senha" value={formData.senha} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block' }}>Telefone / WhatsApp</label>
          <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(00) 00000-0000" style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block' }}>{formData.tipo_usuario === 'Costureira' ? 'CPF / CNPJ' : 'CPF'}</label>
          <input type="text" name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block' }}>Endereço / Cidade</label>
          <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>

        {/* Campos extras para Costureira */}
        {formData.tipo_usuario === 'Costureira' && (
          <>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block' }}>Especialidades (ex: Ajustes, Vestidos de Festa, Sob Medida)</label>
              <input type="text" name="especialidades" value={formData.especialidades} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block' }}>Biografia / Apresentação</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}></textarea>
            </div>
          </>
        )}

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#7A5B72', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
          Finalizar Cadastro
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
        Já tem uma conta?{' '}
        <a href="#login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} style={{ color: '#3E2445', fontWeight: 'bold' }}>
          Faça Login
        </a>
      </p>
    </div>
  );
}

export default Cadastro;