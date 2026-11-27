const { gerarEmailAlertaLogin, gerarEmailRecuperacao } = require('./emailTemplates');

const EMAIL_OFICIAL = process.env.EMAIL_USER || 'noreply.atelie.entre.linhas@gmail.com';
const REMETENTE_RESEND = process.env.RESEND_FROM || 'Ateliê Entre Linhas <onboarding@resend.dev>';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

async function dispararViaResend({ para, assunto, texto, html, replyTo = null }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY não configurada nas variáveis de ambiente!');
  }

  const payload = {
    from: REMETENTE_RESEND,
    to: Array.isArray(para) ? para : [para],
    subject: assunto,
    text: texto,
    html: html || texto
  };

  if (replyTo) {
    payload.reply_to = replyTo;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Erro HTTP ${response.status} ao enviar via Resend`);
  }

  return data;
}

async function enviarEmail(para, assunto, texto, html) {
  try {
    await dispararViaResend({ para, assunto, texto, html });
    console.log(`[E-mail] Enviado com sucesso para ${para}`);
  } catch (err) {
    console.error(`[E-mail Erro] Falha ao enviar para ${para}:`, err.message);
  }
}

async function enviarEmailNovoAcesso(email, nome, tokenOuLink = null) {
  try {
    const dataHoraAcesso = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });

    const linkRedefinicao = tokenOuLink
      ? (String(tokenOuLink).startsWith('http')
          ? tokenOuLink
          : `${FRONTEND_URL}/?tela=redefinirSenha&token=${tokenOuLink}`)
      : null;

    const urlEsqueciSenha = `${FRONTEND_URL}/?tela=esqueciSenha`;

    const html = gerarEmailAlertaLogin({
      nomeUsuario: nome,
      dataHoraAcesso,
      linkRedefinicao,
      urlEsqueciSenha
    });

    await enviarEmail(
      email,
      'Novo Acesso Detectado - Ateliê Entre Linhas',
      `Olá, ${nome}! Registramos uma nova entrada no portal do Ateliê Entre Linhas em ${dataHoraAcesso}. Se não foi você, acesse: ${linkRedefinicao || urlEsqueciSenha}`,
      html
    );
  } catch (err) {
    console.error('Erro ao enviar e-mail de novo acesso:', err);
  }
}

async function enviarEmailRecuperacao(emailUsuario, nomeUsuario, token) {
  const linkRedefinicao = `${FRONTEND_URL}/?tela=redefinirSenha&token=${token}`;
  const html = gerarEmailRecuperacao({
    nomeUsuario,
    linkRedefinicao
  });

  await dispararViaResend({
    para: emailUsuario,
    assunto: 'Redefinição de Senha - Ateliê Entre Linhas',
    texto: `Olá, ${nomeUsuario}! Acesse o link a seguir (válido por 1 hora) para redefinir sua senha: ${linkRedefinicao}`,
    html,
    replyTo: EMAIL_OFICIAL
  });

  console.log(`[E-mail] Recuperação enviada com sucesso para ${emailUsuario}`);
}

module.exports = {
  EMAIL_OFICIAL,
  enviarEmail,
  enviarEmailNovoAcesso,
  enviarEmailRecuperacao
};