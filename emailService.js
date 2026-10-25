const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Módulo nativo do Node.js

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function enviarEmailNovoAcesso(emailDestino, nomeUsuario, pool) {
  try {
    const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // 1. Gera um token seguro de 32 bytes
    const tokenRedefinicao = crypto.randomBytes(32).toString('hex');
    const expiracao = new Date(Date.now() + 3600000); // Token válido por 1 hora

    // 2. Salva o token no banco de dados associado ao usuário
    if (pool) {
      await pool.query(
        'UPDATE usuarios SET token_redefinicao = $1, token_expiracao = $2 WHERE email = $3',
        [tokenRedefinicao, expiracao, emailDestino]
      );
    }

    // 3. Monta o link seguro com o token único
    const linkAlterarSenha = `http://localhost:5173/?tela=redefinirSenha&token=${tokenRedefinicao}`;

    await transporter.sendMail({
      from: `"Ateliê Entre Linhas" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: 'Aviso de Segurança: Novo acesso à sua conta - Ateliê Entre Linhas',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background-color: #FAF8F5; border-radius: 16px; overflow: hidden; border: 1px solid #E8D5C4; box-shadow: 0 4px 15px rgba(62, 36, 69, 0.08);">
          
          <div style="background-color: #3E2445; padding: 32px 20px; text-align: center; border-bottom: 4px solid #C59B6C;">
            <h1 style="color: #F8F5F0; margin: 0; font-size: 24px; font-weight: normal; letter-spacing: 1px;">
              Ateliê Entre Linhas
            </h1>
          </div>

          <div style="padding: 35px 30px; color: #2C2C2C; line-height: 1.7;">
            <h2 style="color: #3E2445; margin-top: 0; font-size: 20px;">
              Olá, ${nomeUsuario || 'cliente'}!
            </h2>
            
            <p style="font-size: 15px; color: #4A4A4A;">
              Passando para avisar que registramos uma nova entrada no portal do <strong>Ateliê Entre Linhas</strong>.
            </p>

            <div style="background-color: #FFFFFF; border: 1px dashed #C59B6C; border-radius: 10px; padding: 18px 20px; margin: 25px 0;">
              <div style="font-size: 11px; color: #8C7262; text-transform: uppercase; font-weight: bold; letter-spacing: 0.8px; margin-bottom: 6px;">
                Horário do Acesso
              </div>
              <div style="color: #3E2445; font-size: 16px; font-weight: bold;">
                ${dataHora}
              </div>
            </div>

            <p style="font-size: 14px; color: #666;">
              Se foi você quem acabou de entrar, está tudo certo!
            </p>

            <div style="background-color: #FFF5F5; border-left: 4px solid #D9534F; border-radius: 6px; padding: 20px; margin-top: 30px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #A94442; font-weight: bold;">
                Não foi você que acessou?
              </p>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #666;">
                Este link seguro é válido por 1 hora para redefinir sua senha:
              </p>
              
              <div style="text-align: center; margin-bottom: 15px;">
                <a href="${linkAlterarSenha}" target="_blank" style="display: inline-block; background-color: #3E2445; color: #FFFFFF !important; text-decoration: none; padding: 12px 26px; border-radius: 8px; font-size: 14px; font-weight: bold; border: 1px solid #2B1830;">
                  Alterar Minha Senha Agora
                </a>
              </div>

              <div style="font-size: 12px; color: #777; text-align: center; word-break: break-all;">
                Se o botão não abrir, acesse:<br />
                <a href="${linkAlterarSenha}" target="_blank" style="color: #3E2445; text-decoration: underline; font-weight: bold;">
                  ${linkAlterarSenha}
                </a>
              </div>
            </div>

          </div>

          <div style="background-color: #F0EAE1; padding: 20px; text-align: center; border-top: 1px solid #E2D7C8;">
            <p style="font-size: 12px; color: #7A6958; margin: 0; font-style: italic;">
              Equipe Ateliê Entre Linhas
            </p>
          </div>

        </div>
      `
    });

    console.log(`✉️ E-mail seguro com token enviado para: ${emailDestino}`);
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail de acesso:', error.message);
  }
}

module.exports = { enviarEmailNovoAcesso };