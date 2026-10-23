import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Cadastro from './components/Cadastro';
import Perfil from './components/Perfil';
import MeusPedidos from './components/MeusPedidos';
import PublicarPedido from './components/PublicarPedido';
import RecuperarSenha from './components/RecuperarSenha';
import RedefinirSenha from './components/RedefinirSenha';

function App() {
  const [telaAtual, setTelaAtual] = useState('login');
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      setTelaAtual('redefinirSenha');
      return;
    }

    const usuarioSalvo = localStorage.getItem('usuarioAtelie');
    if (usuarioSalvo) {
      setUsuarioLogado(JSON.parse(usuarioSalvo));
      setTelaAtual('pedidos');
    }
  }, []);

  const handleLoginSucesso = (usuario) => {
    setUsuarioLogado(usuario);
    setTelaAtual('pedidos');
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioAtelie');
    setUsuarioLogado(null);
    setTelaAtual('login');
  };

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', background: '#3E2445', color: '#fff' }}>
        <h3 
          style={{ margin: 0, cursor: 'pointer' }} 
          onClick={() => setTelaAtual(usuarioLogado ? 'pedidos' : 'login')}
        >
          Ateliê Entre Linhas
        </h3>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {usuarioLogado ? (
            <>
              <button 
                onClick={() => setTelaAtual('pedidos')} 
                style={{
                  padding: '6px 12px',
                  background: telaAtual === 'pedidos' ? '#fff' : 'transparent',
                  color: telaAtual === 'pedidos' ? '#3E2445' : '#fff',
                  border: '1px solid #fff',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Meus Pedidos
              </button>
              <button 
                onClick={() => setTelaAtual('perfil')} 
                style={{
                  padding: '6px 12px',
                  background: telaAtual === 'perfil' ? '#fff' : 'transparent',
                  color: telaAtual === 'perfil' ? '#3E2445' : '#fff',
                  border: '1px solid #fff',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Meu Perfil ({usuarioLogado.nome ? usuarioLogado.nome.split(' ')[0] : 'Usuário'})
              </button>
              <button 
                onClick={handleLogout} 
                style={{ padding: '6px 12px', background: '#c62828', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              {telaAtual !== 'login' && (
                <button 
                  onClick={() => setTelaAtual('login')} 
                  style={{ padding: '6px 12px', background: 'transparent', color: '#fff', border: '1px solid #fff', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Entrar
                </button>
              )}
              {telaAtual !== 'cadastro' && (
                <button 
                  onClick={() => setTelaAtual('cadastro')} 
                  style={{ padding: '6px 12px', background: '#fff', color: '#3E2445', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cadastrar
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      <main style={{ padding: '20px' }}>
        {telaAtual === 'login' && <Login onNavigate={setTelaAtual} onLoginSucesso={handleLoginSucesso} />}
        {telaAtual === 'cadastro' && <Cadastro onNavigate={setTelaAtual} />}
        {telaAtual === 'recuperarSenha' && <RecuperarSenha onNavigate={setTelaAtual} />}
        {telaAtual === 'redefinirSenha' && <RedefinirSenha onNavigate={setTelaAtual} />}
        {telaAtual === 'pedidos' && <MeusPedidos usuario={usuarioLogado} onNavigate={setTelaAtual} />}
        {telaAtual === 'publicarPedido' && <PublicarPedido usuario={usuarioLogado} onNavigate={setTelaAtual} />}
        {telaAtual === 'perfil' && <Perfil usuario={usuarioLogado} />}
      </main>
    </div>
  );
}

export default App;