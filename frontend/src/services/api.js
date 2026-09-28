const API_URL = "http://localhost:3000/api";

export async function loginUsuario(email, senha) {
  const resposta = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      senha,
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.error || "Erro ao realizar login.");
  }

  return dados;
}

export async function cadastrarUsuario(nome, email, senha, perfil) {
  const resposta = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome,
      email,
      senha,
      perfil,
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.error || "Erro ao realizar cadastro.");
  }

  return dados;
}