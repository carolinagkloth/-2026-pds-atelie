import React from 'react';
import '../styles/Inicio.css';
import bannerAtelie from '../assets/atelie-banner.svg';


export default function Inicio({
  onNavigate
}) {

  return (

    <div className="inicio-page">


      {/* BANNER */}

      <div className="inicio-banner">

        <img
          src={bannerAtelie}
          alt="Ateliê entre Linhas"
        />

      </div>


      {/* CONTEÚDO */}

      <main className="inicio-wrapper">


        {/* HERO */}

        <section className="hero-card">

          <span className="badge-pill">
            Ateliê entre Linhas
          </span>


          <h1 className="hero-titulo">
            Conectando Ideias à Costura sob Medida
          </h1>


          <p className="hero-subtitulo">
            A plataforma ideal para encomendar peças exclusivas,
            solicitar ajustes sob medida ou encontrar novos projetos
            de costura como profissional.
          </p>


          {/* ACESSOS */}

          <div className="cta-grid">


            <div className="cta-card cta-destaque">

              <div>

                <span className="cta-tag">
                  Novo por aqui?
                </span>

                <h3>
                  Criar uma conta
                </h3>

                <p>
                  Publique pedidos ou ofereça seus serviços de costura.
                </p>

              </div>


              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  onNavigate('cadastro')
                }
              >
                Cadastre-se no Ateliê
              </button>

            </div>


            <div className="cta-card">

              <div>

                <span className="cta-tag">
                  Já possui conta?
                </span>

                <h3>
                  Acessar painel
                </h3>

                <p>
                  Entre para gerenciar suas solicitações e mensagens.
                </p>

              </div>


              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  onNavigate('login')
                }
              >
                Entrar na Conta
              </button>

            </div>


          </div>

        </section>


        {/* CLIENTE / COSTUREIRA */}

        <section className="features-grid">


          <div className="feature-card">

            <span className="feature-tag">
              Para clientes
            </span>

            <h3>
              Encontre quem transforme sua ideia em realidade
            </h3>

            <p>
              Publique solicitações com fotos de referência,
              detalhes do serviço e prazos para receber propostas
              de costureiras.
            </p>

          </div>


          <div className="feature-card">

            <span className="feature-tag">
              Para costureiras
            </span>

            <h3>
              Novos projetos para o seu trabalho
            </h3>

            <p>
              Explore pedidos, escolha trabalhos alinhados à sua
              especialidade e amplie sua carteira de clientes.
            </p>

          </div>


        </section>


      </main>

    </div>

  );

}