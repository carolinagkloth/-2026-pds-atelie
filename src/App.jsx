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
import MeusChats from './components/MeusChats.jsx';
import Portfolio from './components/Portfolio.jsx';
import BotaoNotificacoes from './components/BotaoNotificacoes.jsx';
import ConfiguracoesNotificacoes from './components/ConfiguracoesNotificacoes.jsx';

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  const [pedidoSelecionado, setPedidoSelecionado] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const pedidoParam = params.get('pedido');
    const costureiraParam = params.get('costureira');
    if (pedidoParam) {
      return {
        id: Number(pedidoParam),
        id_pedido: Number(pedidoParam),
        ...(costureiraParam
          ? { id_costureira: Number(costureiraParam), costureiraId: Number(costureiraParam) }
          : {})
      };
    }
    return null;
  });

  const [dadosCadastroGoogle, setDadosCadastroGoogle] = useState(null);

  const [idCostureiraPortfolio, setIdCostureiraPortfolio] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const costureiraParam = params.get('costureira');
    return costureiraParam ? Number(costureiraParam) : null;
  });

  // Inicialização inteligente da tela considerando F5 e aba nova
  const [telaAtual, setTelaAtual] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const telaParam = params.get('tela');
    const token = params.get('token');

    if (telaParam === 'redefinirSenha' || telaParam === 'recuperar-senha' || token) {
      return 'redefinirSenha';
    }

    if (telaParam) {
      return telaParam;
    }

    try {
      const item = localStorage.getItem('usuarioAtelie');
      const user = item && item !== 'undefined' ? JSON.parse(item) : null;
      if (user) {
        const tipo = (user.tipo_usuario || user.tipoUsuario || '').toString().toLowerCase();
        return tipo === 'costureira' ? 'feedPedidos' : 'meusPedidos';
      }
    } catch {}

    return 'inicio';
  });

  const rotasPrivadas = [
    'meusPedidos',
    'feedPedidos',
    'perfil',
    'publicarPedido',
    'chat',
    'meusChats',
    'portfolio',
    'configuracoesNotificacoes'
  ];

  // 1. Sincronização em tempo real entre abas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'usuarioAtelie') {
        try {
          const novousuario = e.newValue ? JSON.parse(e.newValue) : null;
          setUsuarioLogado(novousuario);
        } catch {
          setUsuarioLogado(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 2. Navegação pelo botão Voltar/Avançar do navegador (funciona mesmo após F5)
  useEffect(() => {
    const handlePopState = (event) => {
      const params = new URLSearchParams(window.location.search);
      const telaUrl = event.state?.tela || params.get('tela');
      const dadosExtra = event.state?.dadosExtra;

      if (telaUrl) {
        setTelaAtual(telaUrl);
        if (telaUrl === 'portfolio') {
          const costId = dadosExtra || params.get('costureira');
          setIdCostureiraPortfolio(costId ? Number(costId) : null);
        } else if (telaUrl === 'chat') {
          if (dadosExtra) {
            setPedidoSelecionado(dadosExtra);
          } else {
            const pedId = params.get('pedido');
            const costId = params.get('costureira');
            if (pedId) {
              setPedidoSelecionado({
                id: Number(pedId),
                id_pedido: Number(pedId),
                ...(costId ? { id_costureira: Number(costId), costureiraId: Number(costId) } : {})
              });
            }
          }
        }
      } else {
        setTelaAtual('inicio');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Redireciona para login se tentar acessar rota privada deslogado
  useEffect(() => {
    if (!usuarioLogado && rotasPrivadas.includes(telaAtual)) {
      setTelaAtual('login');
      window.history.replaceState({ tela: 'login' }, '', '?tela=login');
    }
  }, [usuarioLogado, telaAtual]);

  const handleNavigate = (novaTela, dadosExtra = null, pushToHistory = true) => {
    let idPedidoParaUrl = null;
    let idCostureiraParaUrl = null;

    if (dadosExtra) {
      if (novaTela === 'cadastro') {
        setDadosCadastroGoogle(dadosExtra);
      } else if (novaTela === 'portfolio') {
        idCostureiraParaUrl = Number(dadosExtra);
        setIdCostureiraPortfolio(idCostureiraParaUrl);
      } else if (novaTela === 'chat') {
        const pedidoObj =
          typeof dadosExtra === 'object'
            ? dadosExtra
            : { id: Number(dadosExtra), id_pedido: Number(dadosExtra) };
        setPedidoSelecionado(pedidoObj);
        idPedidoParaUrl = pedidoObj.id_pedido || pedidoObj.id || pedidoObj.idPedido;
        idCostureiraParaUrl = pedidoObj.id_costureira || pedidoObj.costureiraId || null;
      } else {
        setPedidoSelecionado(dadosExtra);
      }
    } else if (novaTela === 'portfolio') {
      setIdCostureiraPortfolio(null);
    }

    if (!usuarioLogado && rotasPrivadas.includes(novaTela)) {
      setTelaAtual('login');
      return;
    }

    if (pushToHistory) {
      const urlParams = new URLSearchParams();
      urlParams.set('tela', novaTela);
      if (novaTela === 'chat' && idPedidoParaUrl) {
        urlParams.set('pedido', idPedidoParaUrl);
        if (idCostureiraParaUrl) urlParams.set('costureira', idCostureiraParaUrl);
      }
      if (novaTela === 'portfolio' && idCostureiraParaUrl) {
        urlParams.set('costureira', idCostureiraParaUrl);
      }

      window.history.pushState({ tela: novaTela, dadosExtra }, '', `?${urlParams.toString()}`);
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

  const idUsuarioLogado = usuarioLogado?.id_usuario || usuarioLogado?.id;
  const tipoUsuarioLogado = (usuarioLogado?.tipo_usuario || usuarioLogado?.tipoUsuario || '').toString().toLowerCase();

  return (
    <div>
      {/* Sininho de Notificações no topo superior direito */}
      {usuarioLogado && rotasPrivadas.includes(telaAtual) && (
        <div style={{ position: 'fixed', top: '15px', right: '20px', zIndex: 1100 }}>
          <BotaoNotificacoes usuario={usuarioLogado} onNavigate={handleNavigate} />
        </div>
      )}

      {/* ROTAS PÚBLICAS */}
      {telaAtual === 'inicio' && <Inicio onNavigate={handleNavigate} />}

      {telaAtual === 'login' && (
        <Login
          onNavigate={handleNavigate}
          onLoginSucesso={handleAutenticacaoSucesso}
        />
      )}

      {telaAtual === 'cadastro' && (
        <Cadastro
          onNavigate={handleNavigate}
          dadosPreenchidos={dadosCadastroGoogle}
          onCadastroSucesso={handleAutenticacaoSucesso}
        />
      )}

      {telaAtual === 'recuperarSenha' && <RecuperarSenha onNavigate={handleNavigate} />}

      {telaAtual === 'redefinirSenha' && <RedefinirSenha onNavigate={handleNavigate} />}

      {/* ROTAS PROTEGIDAS */}
      {usuarioLogado && telaAtual === 'meusPedidos' && (
        <MeusPedidos usuario={usuarioLogado} onNavigate={handleNavigate} />
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

      {usuarioLogado && telaAtual === 'meusChats' && (
        <MeusChats usuario={usuarioLogado} onNavigate={handleNavigate} />
      )}

      {usuarioLogado && telaAtual === 'portfolio' && (
        <Portfolio
          idCostureira={idCostureiraPortfolio || idUsuarioLogado}
          modoEdicao={
            tipoUsuarioLogado === 'costureira' &&
            Number(idCostureiraPortfolio || idUsuarioLogado) === Number(idUsuarioLogado)
          }
          onNavigate={handleNavigate}
        />
      )}

      {usuarioLogado && telaAtual === 'configuracoesNotificacoes' && (
        <ConfiguracoesNotificacoes usuario={usuarioLogado} onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export default App;