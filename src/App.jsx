import React, { useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';

import Inicio from './components/Inicio';
import Login from './components/Login';
import Cadastro from './components/Cadastro';
import RecuperarSenha from './components/RecuperarSenha';
import PublicarPedido from './components/PublicarPedido';
import FeedPedidos from './components/FeedPedidos';
import MeusPedidos from './components/MeusPedidos';
import Chat from './components/Chat';
import TabelaPrecos from './components/TabelaPrecos';

function App() {
  const navigate = useNavigate();
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoAtivoChat, setPedidoAtivoChat] = useState(null);

  const handleLoginSucesso = (dadosUsuario) => {
    setUsuarioLogado(dadosUsuario);
    if (dadosUsuario.tipo_usuario === 'Costureira') {
      navigate('/mural');
    } else {
      navigate('/meus-pedidos');
    }
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    setPedidoAtivoChat(null);
    navigate('/');
  };

  const handlePublicarPedidoSucesso = (novoPedido) => {
    setPedidos((prev) => [novoPedido, ...prev]);
    navigate('/meus-pedidos');
  };

  const handleDemonstrarInteresse = (pedido) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedido.id ? { ...p, status: 'Em Negociação', costureiraNome: usuarioLogado?.nome } : p))
    );
    setPedidoAtivoChat(pedido);
    navigate('/chat');
  };

  const handleAbrirChatCliente = (pedido) => {
    setPedidoAtivoChat(pedido);
    navigate('/chat');
  };

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#FAF7F5' }}>
      {/* CABEÇALHO COM LINKS DE NAVEGAÇÃO */}
      <header style={{ padding: '12px 20px', background: '#3E2445', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, cursor: 'pointer' }} onClick={() => navigate('/')}>
          Ateliê Entre Linhas
        </h3>

        <nav style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {usuarioLogado ? (
            <>
              {usuarioLogado.tipo_usuario === 'Cliente' && (
                <>
                  <button onClick={() => navigate('/publicar-pedido')} style={{ padding: '6px 12px', background: '#7A5B72', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    + Publicar Pedido
                  </button>
                  <button onClick={() => navigate('/meus-pedidos')} style={{ padding: '6px 12px', background: 'transparent', color: '#fff', border: '1px solid #7A5B72', borderRadius: '4px', cursor: 'pointer' }}>
                    📋 Meus Pedidos
                  </button>
                </>
              )}

              {usuarioLogado.tipo_usuario === 'Costureira' && (
                <>
                  <button onClick={() => navigate('/mural')} style={{ padding: '6px 12px', background: '#7A5B72', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Mural de Pedidos
                  </button>
                  <button onClick={() => navigate('/tabela-precos')} style={{ padding: '6px 12px', background: 'transparent', color: '#fff', border: '1px solid #7A5B72', borderRadius: '4px', cursor: 'pointer' }}>
                    🏷️ Minha Tabela de Preços
                  </button>
                </>
              )}

              <span style={{ marginLeft: '10px', fontSize: '13px' }}>
                {usuarioLogado.nome} ({usuarioLogado.tipo_usuario})
              </span>

              <button onClick={handleLogout} style={{ cursor: 'pointer', background: '#7A5B72', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px' }}>
                Sair
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} style={{ padding: '6px 14px', background: '#7A5B72', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Entrar
              </button>
              <button onClick={() => navigate('/cadastro')} style={{ padding: '6px 14px', background: '#fff', color: '#3E2445', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cadastre-se
              </button>
            </>
          )}
        </nav>
      </header>

      {/* DEFINIÇÃO DAS ROTAS */}
      <main style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Inicio onNavigate={(path) => navigate(`/${path}`)} />} />
          <Route path="/login" element={<Login onNavigate={(path) => navigate(`/${path}`)} onLoginSucesso={handleLoginSucesso} />} />
          <Route path="/cadastro" element={<Cadastro onNavigate={(path) => navigate(`/${path}`)} onCadastroSucesso={handleLoginSucesso} />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha onNavigate={(path) => navigate(`/${path}`)} />} />
          <Route path="/publicar-pedido" element={<PublicarPedido usuarioLogado={usuarioLogado} onPublicarSucesso={handlePublicarPedidoSucesso} />} />
          <Route path="/mural" element={<FeedPedidos pedidos={pedidos} usuarioLogado={usuarioLogado} onDemonstrarInteresse={handleDemonstrarInteresse} />} />
          <Route path="/meus-pedidos" element={<MeusPedidos pedidos={pedidos} usuarioLogado={usuarioLogado} onAbrirChat={handleAbrirChatCliente} />} />
          <Route path="/chat" element={<Chat usuarioLogado={usuarioLogado} pedidoAtivo={pedidoAtivoChat} onNavigate={(path) => navigate(`/${path}`)} />} />
          <Route path="/tabela-precos" element={<TabelaPrecos usuarioLogado={usuarioLogado} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;