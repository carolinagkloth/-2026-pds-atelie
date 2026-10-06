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
          <span className="feature-icon">✨</span>
          <h3>Para Clientes</h3>
          <p>
            Publique solicitações com fotos de referência, detalhes de tecidos 
            e prazos para receber propostas de artesãs qualificadas.
          </p>
        </div>

        <div className="feature-card">
          {/* Ícone de Tesoura/Ateliê em SVG (Compatibilidade Universal) */}
          <span className="feature-icon">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#7A5B72" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
          </span>
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