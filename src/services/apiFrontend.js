const API_URL = "/api";

async function lerResposta(resposta) {
  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.error || "Erro ao processar a solicitação."
    );
  }

  return dados;
}

export async function loginUsuario(email, senha) {
  const resposta = await fetch(
    `${API_URL}/usuario/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        senha,
      }),
    }
  );

  return lerResposta(resposta);
}

export async function cadastrarUsuario(
  nome,
  email,
  senha,
  tipoUsuario
) {
  const resposta = await fetch(
    `${API_URL}/usuario/cadastrar`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome,
        email,
        senha,
        tipo_usuario: tipoUsuario,
      }),
    }
  );

  return lerResposta(resposta);
}

