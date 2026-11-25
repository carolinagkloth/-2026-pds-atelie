import React, { useState, useEffect } from 'react';
import '../styles/Cadastro.css';
import bannerAtelie from '../assets/atelie-banner.svg';


const IconOlhoAberto = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#917687"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);


const IconOlhoFechado = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#917687"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);


const aplicarMascaraTelefone = (valor) => {

  const apenasNumeros =
    valor
      .replace(/\D/g, '')
      .slice(0, 11);


  if (apenasNumeros.length <= 10) {

    return apenasNumeros
      .replace(
        /(\d{2})(\d{4})(\d{0,4})/,
        '($1) $2-$3'
      )
      .replace(/-$/, '');

  }


  return apenasNumeros
    .replace(
      /(\d{2})(\d{5})(\d{0,4})/,
      '($1) $2-$3'
    )
    .replace(/-$/, '');

};


const aplicarMascaraCpfCnpj = (valor) => {

  const apenasNumeros =
    valor
      .replace(/\D/g, '')
      .slice(0, 14);


  if (apenasNumeros.length <= 11) {

    return apenasNumeros
      .replace(
        /(\d{3})(\d)/,
        '$1.$2'
      )
      .replace(
        /(\d{3})(\d)/,
        '$1.$2'
      )
      .replace(
        /(\d{3})(\d{1,2})$/,
        '$1-$2'
      );

  }


  return apenasNumeros
    .replace(
      /^(\d{2})(\d)/,
      '$1.$2'
    )
    .replace(
      /^(\d{2})\.(\d{3})(\d)/,
      '$1.$2.$3'
    )
    .replace(
      /\.(\d{3})(\d)/,
      '.$1/$2'
    )
    .replace(
      /(\d{4})(\d{1,2})$/,
      '$1-$2'
    );

};


function Cadastro({
  onNavigate,
  onCadastroSucesso,
  dadosPreenchidos
}) {

  const [nome, setNome] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [senha, setSenha] =
    useState('');

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [telefone, setTelefone] =
    useState('');

  const [cpfCnpj, setCpfCnpj] =
    useState('');

  const [tipoUsuario, setTipoUsuario] =
    useState('Cliente');

  const [endereco, setEndereco] =
    useState('');

  const [erro, setErro] =
    useState('');

  const [sucesso, setSucesso] =
    useState('');

  const [carregando, setCarregando] =
    useState(false);


  const isCostureira =
    tipoUsuario === 'Costureira';


  /* ========================================
     DADOS DO GOOGLE
  ======================================== */

  useEffect(() => {

    if (dadosPreenchidos) {

      if (dadosPreenchidos.nome) {
        setNome(
          dadosPreenchidos.nome
        );
      }


      if (dadosPreenchidos.email) {
        setEmail(
          dadosPreenchidos.email
        );
      }

    }

  }, [dadosPreenchidos]);


  const handleTelefoneChange = (e) => {

    setTelefone(
      aplicarMascaraTelefone(
        e.target.value
      )
    );

  };


  const handleCpfCnpjChange = (e) => {

    setCpfCnpj(
      aplicarMascaraCpfCnpj(
        e.target.value
      )
    );

  };


  /* ========================================
     CADASTRO - LÓGICA DA CAROLINA
  ======================================== */

  const handleSubmit = async (e) => {

    e.preventDefault();

    setErro('');
    setSucesso('');


    if (
      !telefone ||
      telefone.trim().length < 14
    ) {

      setErro(
        'Por favor, informe um número de WhatsApp/Telefone válido com DDD.'
      );

      return;

    }


    if (senha.length < 8) {

      setErro(
        'A senha deve ter no mínimo 8 dígitos.'
      );

      return;

    }


    if (
      isCostureira &&
      !endereco.trim()
    ) {

      setErro(
        'O endereço de atendimento é obrigatório para cadastro de costureira.'
      );

      return;

    }


    setCarregando(true);


    try {

      const response =
        await fetch(
          '/api/usuario/cadastro',
      {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                nome,
                email,
                senha,
                telefone,
                cpf_cnpj:
                  cpfCnpj,

                tipo_usuario:
                  tipoUsuario,

                endereco:
                  isCostureira
                    ? endereco.trim()
                    : ''
              })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.erro ||
          'Erro ao realizar cadastro.'
        );

      }


      setSucesso(
        'Cadastro realizado com sucesso!'
      );


      setTimeout(() => {

        if (onCadastroSucesso) {

          onCadastroSucesso(
            data.usuario
          );

        } else if (onNavigate) {

          onNavigate(
            'login'
          );

        }

      }, 1500);


    } catch (err) {

      setErro(
        err.message
      );

    } finally {

      setCarregando(false);

    }

  };


  return (

    <div className="cadastro-page">


      {/* BANNER */}

      <section className="cadastro-banner">

        <img
          src={bannerAtelie}
          alt="Banner Ateliê Entre Linhas"
        />

      </section>


      {/* ÁREA DO CADASTRO */}

      <main className="cadastro-area">

        <div className="cadastro-card">


          {/* CABEÇALHO */}

          <div className="cadastro-cabecalho">

            <span className="cadastro-etiqueta">
              Faça parte do ateliê
            </span>


            <h1>
              Criar uma conta
            </h1>


            <p className="cadastro-subtitle">
              Cadastre-se para publicar pedidos,
              encontrar serviços de costura ou
              divulgar seu trabalho.
            </p>

          </div>


          {/* MENSAGENS */}

          {erro && (

            <div className="cadastro-erro">
              {erro}
            </div>

          )}


          {sucesso && (

            <div className="cadastro-sucesso">
              {sucesso}
            </div>

          )}


          <form
            onSubmit={handleSubmit}
          >


            {/* NOME */}

            <div className="cadastro-form-group">

              <label>
                Nome completo *
              </label>


              <input
                type="text"

                value={nome}

                onChange={(e) =>
                  setNome(
                    e.target.value
                  )
                }

                placeholder="Seu nome completo"

                autoComplete="name"

                required
              />

            </div>


            {/* EMAIL */}

            <div className="cadastro-form-group">

              <label>
                E-mail *
              </label>


              <input
                type="email"

                value={email}

                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }

                placeholder="seuemail@exemplo.com"

                autoComplete="email"

                required
              />

            </div>


            {/* SENHA */}

            <div className="cadastro-form-group">

              <label>
                Senha *
              </label>


              <div className="cadastro-senha-box">

                <input
                  type={
                    mostrarSenha
                      ? 'text'
                      : 'password'
                  }

                  value={senha}

                  minLength={8}

                  onChange={(e) =>
                    setSenha(
                      e.target.value
                    )
                  }

                  placeholder="Mínimo de 8 caracteres"

                  autoComplete="new-password"

                  required
                />


                <button
                  type="button"

                  className="cadastro-olho"

                  onClick={() =>
                    setMostrarSenha(
                      !mostrarSenha
                    )
                  }

                  title={
                    mostrarSenha
                      ? 'Ocultar senha'
                      : 'Exibir senha'
                  }
                >

                  {mostrarSenha
                    ? <IconOlhoFechado />
                    : <IconOlhoAberto />
                  }

                </button>

              </div>


              <small className="cadastro-ajuda">
                A senha deve ter pelo menos 8 dígitos.
              </small>

            </div>


            {/* TELEFONE + CPF */}

            <div className="cadastro-duas-colunas">


              <div className="cadastro-form-group">

                <label>
                  WhatsApp / Telefone *
                </label>


                <input
                  type="text"

                  value={telefone}

                  onChange={
                    handleTelefoneChange
                  }

                  placeholder="(42) 99999-9999"

                  required
                />


                <small className="cadastro-ajuda">
                  Para envio de lembretes e avisos.
                </small>

              </div>


              <div className="cadastro-form-group">

                <label>
                  CPF / CNPJ
                </label>


                <input
                  type="text"

                  value={cpfCnpj}

                  onChange={
                    handleCpfCnpjChange
                  }

                  placeholder="000.000.000-00"
                />

              </div>


            </div>


            {/* TIPO */}

            <div className="cadastro-form-group">

              <label>
                Tipo de perfil *
              </label>


              <select
                value={tipoUsuario}

                onChange={(e) =>
                  setTipoUsuario(
                    e.target.value
                  )
                }
              >

                <option value="Cliente">
                  Cliente — quero contratar serviços
                </option>

                <option value="Costureira">
                  Costureira — quero oferecer serviços
                </option>

              </select>

            </div>


            {/* COSTUREIRA */}

            {isCostureira && (

              <>


                <div className="cadastro-form-group">

                  <label>
                    Endereço de Atendimento / Ateliê *
                  </label>


                  <input
                    type="text"

                    value={endereco}

                    onChange={(e) =>
                      setEndereco(
                        e.target.value
                      )
                    }

                    placeholder="Ex.: Rua XV de Novembro, 123 - Centro, Ponta Grossa"

                    required
                  />

                </div>


                <div className="cadastro-privacidade">

                  <strong>
                    Privacidade dos seus dados
                  </strong>

                  <span>
                    Seus dados de contato e endereço (
                    <b>
                      com exceção do CPF/CNPJ
                    </b>
                    , que é confidencial e nunca é
                    compartilhado) só ficarão visíveis
                    para as clientes com quem você
                    firmar pedido.
                  </span>

                </div>


              </>

            )}


            {/* BOTÃO */}

            <button
              type="submit"

              className="cadastro-button"

              disabled={carregando}
            >
              {carregando
                ? 'Cadastrando...'
                : 'Criar minha conta'
              }
            </button>


          </form>


          {/* LOGIN */}

          <div className="cadastro-login">

            <span>
              Já possui uma conta?
            </span>


            <button
              type="button"

              onClick={() =>
                onNavigate &&
                onNavigate(
                  'login'
                )
              }
            >
              Entrar
            </button>

          </div>


        </div>

      </main>

    </div>

  );

}


export default Cadastro;