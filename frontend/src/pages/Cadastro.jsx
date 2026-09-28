import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cadastrarUsuario } from "../services/api";
import Header from "../components/Header";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    setMensagem("");
    setCarregando(true);

    try {
      await cadastrarUsuario(nome, email, senha, perfil);

      setMensagem("Cadastro realizado com sucesso!");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <Header />

      <main className="cadastro-page">
        <div className="caminho">
          Início · Minha Conta · Cadastro
        </div>

        <h2>Criar conta</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="nome">Nome</label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Digite seu nome"
            required
          />

          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ex.: seumail@email.com.br"
            required
          />

          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Digite uma senha"
            required
          />

          <label htmlFor="perfil">Tipo de conta</label>
          <select
            id="perfil"
            value={perfil}
            onChange={(event) => setPerfil(event.target.value)}
            required
          >
            <option value="">Selecione</option>
            <option value="cliente">Cliente</option>
            <option value="costureira">Costureira</option>
          </select>

          <button type="submit" disabled={carregando}>
            {carregando ? "Cadastrando..." : "Criar conta"}
          </button>

          {mensagem && <p>{mensagem}</p>}

          <p>
            Já possui uma conta?{" "}
            <Link to="/login">Entrar</Link>
          </p>
        </form>
      </main>
    </>
  );
}

export default Cadastro;