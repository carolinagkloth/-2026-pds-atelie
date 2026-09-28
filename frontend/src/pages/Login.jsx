import { useState } from "react";
import { Link } from "react-router-dom";
import { loginUsuario } from "../services/api";
import Header from "../components/Header";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMensagem("");
    setCarregando(true);

    try {
      const dados = await loginUsuario(email, senha);

      localStorage.setItem("token", dados.token);
      localStorage.setItem("usuario", JSON.stringify(dados.user));

      setMensagem(`Bem-vinda, ${dados.user.nome}!`);

      console.log("Usuário logado:", dados.user);
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <Header />

      <main className="login">
        <div className="caminho">Início · Minha Conta · Login</div>

        <h2>Iniciar sessão</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label>

          <input
            id="email"
            type="email"
            placeholder="ex.: seumail@email.com.br"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="senha">Senha</label>

          <div className="senha">
            <input
              id="senha"
              type="password"
              placeholder="ex.: suasenha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
          </div>

          <a href="#" className="esqueci">
            Esqueceu a senha?
          </a>

          <button type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Iniciar sessão"}
          </button>

          {mensagem && <p>{mensagem}</p>}

          <p>
            Não possui uma conta ainda?{" "}
            <Link to="/cadastro">Criar uma conta</Link>
          </p>
        </form>
      </main>
    </>
  );
}

export default Login;