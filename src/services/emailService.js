const nodemailer = require('nodemailer');

const EMAIL_OFICIAL = process.env.EMAIL_USER || 'noreply.atelie.entre.linhas@gmail.com';

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

async function enviarEmailNovoAcesso(email, nome) {
  try {
    await enviarEmail(
      email,
      'Novo Acesso Detectado - Ateliê Entre Linhas',
      `Olá, ${nome}. Identificamos um novo acesso à sua conta no Ateliê Entre Linhas.`
    );
  } catch (err) {
    console.error('Erro ao enviar e-mail de novo acesso:', err);
  }
}

async function enviarEmailRecuperacao(emailUsuario, nomeUsuario, token) {
  if (!process.env.EMAIL_PASS) throw new Error('Senha de e-mail não configurada no .env!');

  const linkRedefinicao = `http://localhost:5173/?tela=redefinirSenha&token=${token}`;

  await transporter.sendMail({
    from: `"Ateliê Entre Linhas" <${EMAIL_OFICIAL}>`,
    replyTo: EMAIL_OFICIAL,
    to: emailUsuario,
    subject: 'Redefinição de Senha - Ateliê Entre Linhas',
    html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
             <h2>Olá, ${nomeUsuario}!</h2>
             <p>Clique no link abaixo para redefinir sua senha:</p>
             <a href="${linkRedefinicao}">${linkRedefinicao}</a>
           </div>`
  });
}

module.exports = { 
  transporter, 
  EMAIL_OFICIAL, 
  enviarEmail, 
  enviarEmailNovoAcesso, 
  enviarEmailRecuperacao 
};