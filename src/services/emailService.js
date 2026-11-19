const nodemailer = require('nodemailer');
const { gerarEmailAlertaLogin, gerarEmailRecuperacao } = require('./emailTemplates');

const EMAIL_OFICIAL = process.env.EMAIL_USER || 'noreply.atelie.entre.linhas@gmail.com';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: EMAIL_OFICIAL,
    pass: process.env.EMAIL_PASS
  }
});

async function enviarEmail(para, assunto, texto, html) {
  try {
    await transporter.sendMail({
      from: `"Ateliê Entre Linhas" <${EMAIL_OFICIAL}>`,
      to: para,
      subject: assunto,
      text: texto,
      html: html || texto
    });
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
  if (!process.env.EMAIL_PASS) throw new Error('Senha de e-mail não configurada no .env!');

  const linkRedefinicao = `${FRONTEND_URL}/?tela=redefinirSenha&token=${token}`;
  const html = gerarEmailRecuperacao({
    nomeUsuario,
    linkRedefinicao
  });

  await transporter.sendMail({
    from: `"Ateliê Entre Linhas" <${EMAIL_OFICIAL}>`,
    replyTo: EMAIL_OFICIAL,
    to: emailUsuario,
    subject: 'Redefinição de Senha - Ateliê Entre Linhas',
    text: `Olá, ${nomeUsuario}! Acesse o link a seguir (válido por 1 hora) para redefinir sua senha: ${linkRedefinicao}`,
    html
  });
}

module.exports = {
  transporter,
  EMAIL_OFICIAL,
  enviarEmail,
  enviarEmailNovoAcesso,
  enviarEmailRecuperacao
};