import React, { useState, useEffect } from 'react';
import Inicio from './components/Inicio.jsx';
import Login from './components/Login.jsx';
import Cadastro from './components/Cadastro.jsx';
import RecuperarSenha from './components/RecuperarSenha.jsx';
import RedefinirSenha from './components/RedefinirSenha.jsx';
import MeusPedidos from './components/MeusPedidos.jsx';
import FeedPedidos from './components/FeedPedidos.jsx';
import Perfil from './components/Perfil.jsx';
import PublicarPedido from './components/PublicarPedido.jsx';
import Chat from './components/Chat.jsx';

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  const [telaAtual, setTelaAtual] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tela = params.get('tela');
    const token = params.get('token');
    if (tela === 'redefinirSenha' || tela === 'recuperar-senha' || token) {
      return 'redefinirSenha';
    }
    return 'inicio';
  });

  // Lista de telas que exigem usuário logado
  const rotasPrivadas = ['meusPedidos', 'feedPedidos', 'perfil', 'publicarPedido', 'chat'];

  // Redireciona para o login caso tente acessar uma rota privada sem estar autenticado
  useEffect(() => {
    if (!usuarioLogado && rotasPrivadas.includes(telaAtual)) {
      setTelaAtual('login');
    }
  }, [usuarioLogado, telaAtual]);

  const handleNavigate = (novaTela, dadosExtra = null) => {
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (dadosExtra) {
      setPedidoSelecionado(dadosExtra);
    }

    if (!usuarioLogado && rotasPrivadas.includes(novaTela)) {
      setTelaAtual('login');
      return;
    }

    setTelaAtual(novaTela);
  };

  const handleAutenticacaoSucesso = (dados) => {
    const usuario = dados?.usuario || dados;

    if (usuario && typeof usuario === 'object') {
      try {
        localStorage.setItem('usuarioAtelie', JSON.stringify(usuario));
      } catch (e) {
        console.error('Erro ao salvar no localStorage:', e);
      }

      setUsuarioLogado(usuario);

      const tipoPerfil = (usuario?.tipo_usuario || usuario?.tipoUsuario || '').toString().toLowerCase();

      if (tipoPerfil === 'costureira') {
        handleNavigate('feedPedidos');
      } else {
        handleNavigate('meusPedidos');
      }
    }
  };

  const handleUpdateUsuario = (usuarioAtualizado) => {
    setUsuarioLogado(usuarioAtualizado);
    try {
      localStorage.setItem('usuarioAtelie', JSON.stringify(usuarioAtualizado));
    } catch (e) {
      console.error('Erro ao atualizar usuario no localStorage:', e);
    }
  };

  return (
    <div>
      {/* ROTAS PÚBLICAS */}
      {telaAtual === 'inicio' && (
        <Inicio onNavigate={handleNavigate} />
      )}

      {telaAtual === 'login' && (
        <Login
          onNavigate={handleNavigate}
          onLoginSucesso={handleAutenticacaoSucesso}
        />
      )}

      {telaAtual === 'cadastro' && (
        <Cadastro
          onNavigate={handleNavigate}
          onCadastroSucesso={handleAutenticacaoSucesso}
        />
      )}

      {telaAtual === 'recuperarSenha' && (
        <RecuperarSenha onNavigate={handleNavigate} />
      )}

      {telaAtual === 'redefinirSenha' && (
        <RedefinirSenha onNavigate={handleNavigate} />
      )}

      {/* ROTAS PROTEGIDAS (Apenas com usuarioLogado ativo) */}
      {usuarioLogado && telaAtual === 'meusPedidos' && (
        <MeusPedidos
          usuario={usuarioLogado}
          onNavigate={handleNavigate}
        />
      )}

      {usuarioLogado && telaAtual === 'feedPedidos' && (
        <FeedPedidos
          usuario={usuarioLogado}
          usuarioLogado={usuarioLogado}
          onNavigate={handleNavigate}
          onDemonstrarInteresse={(pedido) => handleNavigate('chat', pedido)}
        />
      )}

      {usuarioLogado && telaAtual === 'perfil' && (
        <Perfil
          usuario={usuarioLogado}
          onNavigate={handleNavigate}
          onUpdateUsuario={handleUpdateUsuario}
        />
      )}

      {usuarioLogado && telaAtual === 'publicarPedido' && (
        <PublicarPedido
          usuario={usuarioLogado}
          onNavigate={handleNavigate}
          onPublicarSucesso={() => handleNavigate('meusPedidos')}
        />
      )}

      {usuarioLogado && telaAtual === 'chat' && (
        <Chat
          usuario={usuarioLogado}
          usuarioLogado={usuarioLogado}
          pedido={pedidoSelecionado}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

export default App;