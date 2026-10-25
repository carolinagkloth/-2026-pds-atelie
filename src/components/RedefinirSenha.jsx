import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import "../styles/RedefinirSenha.css";

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

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao redefinir a senha.');
      }

      alert(data.mensagem);
      navigate('/login');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="redefinir-card">

      <h2>Nova Senha</h2>

      <p className="redefinir-subtitle">
        Escolha uma nova senha para sua conta
      </p>

      {erro && (
        <div className="redefinir-erro">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div className="redefinir-form-group">
          <label>Digite a Nova Senha *</label>

          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
          />
        </div>

        <div className="redefinir-form-group">
          <label>Confirme a Nova Senha *</label>

          <input
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="redefinir-button"
        >
          {carregando ? 'Salvando...' : 'Redefinir Senha'}
        </button>

      </form>
    </div>
  );
}

export default RedefinirSenha;