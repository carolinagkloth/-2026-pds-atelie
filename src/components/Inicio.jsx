import React from 'react';
import '../styles/Inicio.css';

export default function Inicio({ onNavigate }) {
  return (
    <div className="inicio-wrapper">
      {/* Cartão Hero Principal */}
      <section className="hero-card">
        <span className="badge-pill">Ateliê entre Linhas</span>
        
        <h2 className="hero-titulo">Conectando Ideias à Costura sob Medida</h2>
        
        <p className="hero-subtitulo">
          A plataforma ideal para encomendar peças exclusivas, solicitar ajustes sob medida 
          ou encontrar novos projetos de costura como profissional.
        </p>

        {/* Blocos de Ação */}
        <div className="cta-grid">
          <div className="cta-card cta-destaque">
            <div>
              <span className="cta-tag">Novo por aqui?</span>
              <h3>Criar uma conta</h3>
              <p>Publique pedidos ou ofereça seus serviços de costura</p>
            </div>
            <button 
              type="button" 
              className="btn-primary"
              onClick={() => onNavigate('cadastro')}
            >
              Cadastre-se no Ateliê
            </button>
          </div>

          <div className="cta-card">
            <div>
              <span className="cta-tag">Já possui conta?</span>
              <h3>Acessar painel</h3>
              <p>Entre para gerenciar suas solicitações e mensagens</p>
            </div>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => onNavigate('login')}
            >
              Entrar na Conta
            </button>
          </div>
        </div>
      </section>

      {/* Destaques / Benefícios */}
      <section className="features-grid">
        <div className="feature-card">
          <h3>Para Clientes</h3>
          <p>
            Publique solicitações com fotos de referência, detalhes de tecidos 
            e prazos para receber propostas de artesãs qualificadas.
          </p>
        </div>

        <div className="feature-card">
          <h3>Para Costureiras</h3>
          <p>
            Explore pedidos na sua região, escolha projetos alinhados à sua especialidade 
            e expanda sua carteira de clientes.
          </p>
        </div>
      </section>
    </div>
  );
}