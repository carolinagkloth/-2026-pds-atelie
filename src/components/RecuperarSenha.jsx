import React, { useState } from 'react';
import "../styles/RecuperarSenha.css";

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
    <div className="recuperar-card">
      <h2>Recuperar Senha</h2>

      {enviado ? (
        <div className="recuperar-sucesso">
          <p>Instruções enviadas!</p>
          <p>Verifique a caixa de entrada do e-mail <strong>{email}</strong> para redefinir sua senha.</p>
          <button onClick={() => onNavigate('login')} className="recuperar-button">
            Voltar para o Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="recuperar-texto">
            Digite o e-mail associado à sua conta para receber o link de redefinição.
          </p>
          <div className="recuperar-form-group">
            <label>E-mail:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required/>
          </div>

          <button type="submit" 
          className="recuperar-button"
          >
            Enviar Instruções
          </button>
        </form>
      )}

      {!enviado && (
        <div className="recuperar-voltar">
          <a href="#login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} style={{ color: '#7A5B72', fontSize: '14px' }}>
            Voltar para o Login
          </a>
        </div>
      )}
    </div>
  );
}

export default RecuperarSenha;