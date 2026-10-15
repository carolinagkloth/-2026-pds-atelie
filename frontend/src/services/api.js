const API_URL = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("token");
}

/* =========================
   LOGIN
========================= */

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

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.error || "Erro ao realizar login."
    );
  }

  return dados;
}

/* =========================
   CADASTRO
========================= */

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

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.error || "Erro ao realizar cadastro."
    );
  }

  return dados;
}

/* =========================
   PEDIDOS
========================= */

export async function listarPedidos() {
  const resposta = await fetch(
    `${API_URL}/pedidos`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.error || "Erro ao buscar pedidos."
    );
  }

  return dados;
}

export async function buscarPedidoPorId(id) {
  const resposta = await fetch(
    `${API_URL}/pedidos/${id}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.error || "Erro ao buscar pedido."
    );
  }

  return dados;
}

/* =========================
   PORTFÓLIO
========================= */

export async function listarPortfolioCostureira(
  idCostureira
) {
  const resposta = await fetch(
    `${API_URL}/portfolio/costureira/${idCostureira}`
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.error || "Erro ao carregar portfólio."
    );
  }

  return dados;
}

/* =========================
   AVALIAÇÕES
========================= */

export async function listarAvaliacoesCostureira(
  idCostureira
) {
  const resposta = await fetch(
    `${API_URL}/avaliacoes/costureira/${idCostureira}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.error || "Erro ao carregar avaliações."
    );
  }

  return dados;
}

/* =========================
   CHAT
========================= */

export async function listarMensagens(idPedido) {
  const resposta = await fetch(
    `${API_URL}/mensagens/pedido/${idPedido}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.error || "Erro ao carregar mensagens."
    );
  }

  return dados;
}