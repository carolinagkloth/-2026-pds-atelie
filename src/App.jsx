import React, { useState } from 'react';
import './styles/index.css';
import Inicio from './components/Inicio';
import PublicarPedido from './components/PublicarPedido';
import FeedPedidos from './components/FeedPedidos';

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState('inicio'); 
  const [listaPedidos, setListaPedidos] = useState([]);

  // Função para adicionar novo pedido vindo do formulário
  const handleNovoPedido = (novoPedido) => {
    const pedidoComId = { ...novoPedido, id: Date.now(), status: 'Disponível' };
    setListaPedidos((prev) => [pedidoComId, ...prev]);
    setTelaAtiva('feed'); // Redireciona para o feed após publicar
  };

  return (
    <div>
      {/* Cabeçalho do Ateliê com os links principais */}
      <header>
        <h1>Ateliê entre Linhas</h1>
        <nav>
          <button onClick={() => setTelaAtiva('inicio')}>
            Início
          </button>
          <button onClick={() => setTelaAtiva('login')}>
            Login
          </button>
          <button onClick={() => setTelaAtiva('cadastro')}>
            Cadastre-se
          </button>
        </nav>
      </header>

      {/* Renderização condicional das telas */}
      <main>
        {telaAtiva === 'inicio' && (
          <Inicio onNavigate={setTelaAtiva} />
        )}

        {telaAtiva === 'login' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Iniciar Sessão</h2>
            <p style={{ color: '#8C7E87', marginTop: '10px' }}>
              Tela de login em desenvolvimento...
            </p>
          </div>
        )}

        {telaAtiva === 'cadastro' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Criar Conta</h2>
            <p style={{ color: '#8C7E87', marginTop: '10px' }}>
              Tela de cadastro em desenvolvimento...
            </p>
          </div>
        )}

        {telaAtiva === 'feed' && (
          <FeedPedidos pedidos={listaPedidos} />
        )}

        {telaAtiva === 'publicar' && (
          <PublicarPedido onSubmit={handleNovoPedido} />
        )}
      </main>
    </div>
  );
}