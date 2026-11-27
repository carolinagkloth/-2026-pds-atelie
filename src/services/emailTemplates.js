function escaparHtml(texto = '') {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function gerarLayoutEmailBase({
  nomeUsuario = 'Usuário',
  textoPrincipalHtml = '',
  destaqueLabel = '',
  destaqueValorHtml = '',
  textoSecundarioHtml = '',
  botaoTexto = '',
  botaoUrl = '',
  blocoAlerta = null // { titulo, descricao, botaoTexto, botaoUrl }
}) {
  const blocoDestaqueHtml =
    destaqueLabel && destaqueValorHtml
      ? `
        <div style="background-color: #FFFFFF; border: 1.5px dashed #C59B6D; border-radius: 12px; padding: 18px 22px; margin: 22px 0;">
          <p style="margin: 0 0 6px 0; color: #8C6D4F; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;">
            ${escaparHtml(destaqueLabel)}
          </p>
          <div style="margin: 0; color: #3E2445; font-size: 16px; font-weight: 700; line-height: 1.5;">
            ${destaqueValorHtml}
          </div>
        </div>
      `
      : '';

  const botaoPrincipalHtml =
    botaoTexto && botaoUrl
      ? `
        <div style="text-align: center; margin: 24px 0 8px 0;">
          <a href="${botaoUrl}" target="_blank" style="display: inline-block; background-color: #3E2445; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 8px;">
            ${escaparHtml(botaoTexto)}
          </a>
        </div>
      `
      : '';

  const blocoAlertaHtml = blocoAlerta
    ? `
      <div style="background-color: #FDF3F3; border-left: 4px solid #C94A4A; border-radius: 8px; padding: 20px 22px; margin: 24px 0 6px 0;">
        <p style="margin: 0 0 8px 0; color: #B83B3B; font-size: 15px; font-weight: 700;">
          ${escaparHtml(blocoAlerta.titulo)}
        </p>
        <p style="margin: 0 0 18px 0; color: #555555; font-size: 14px; line-height: 1.5;">
          ${escaparHtml(blocoAlerta.descricao)}
        </p>
        ${
          blocoAlerta.botaoUrl
            ? `
              <div style="text-align: center; margin: 16px 0 14px 0;">
                <a href="${blocoAlerta.botaoUrl}" target="_blank" style="display: inline-block; background-color: #3E2445; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 8px;">
                  ${escaparHtml(blocoAlerta.botaoTexto || 'Alterar Minha Senha Agora')}
                </a>
              </div>
              <p style="margin: 12px 0 4px 0; text-align: center; color: #666666; font-size: 12px;">
                Se o botão não abrir, acesse:
              </p>
              <p style="margin: 0; text-align: center; font-size: 12px; word-break: break-all;">
                <a href="${blocoAlerta.botaoUrl}" target="_blank" style="color: #3E2445; font-weight: 600; text-decoration: underline;">
                  ${escaparHtml(blocoAlerta.botaoUrl)}
                </a>
              </p>
            `
            : ''
        }
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin: 0; padding: 20px 10px; background-color: #F2EFE9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #FAF8F6; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 10px rgba(62, 36, 69, 0.08);">
              
              <!-- Cabeçalho Roxo + Filete Dourado -->
              <tr>
                <td style="background-color: #3E2445; padding: 22px 24px; text-align: center; border-bottom: 4px solid #C59B6D;">
                  <span style="color: #FFFFFF; font-size: 23px; font-weight: 500; letter-spacing: 0.3px;">
                    Ateliê Entre Linhas
                  </span>
                </td>
              </tr>

              <!-- Corpo Creme -->
              <tr>
                <td style="background-color: #FAF8F6; padding: 32px 28px;">
                  <h1 style="margin: 0 0 18px 0; color: #3E2445; font-size: 21px; font-weight: 700;">
                    Olá, ${escaparHtml(nomeUsuario)}!
                  </h1>

                  <p style="margin: 0 0 14px 0; color: #4A4A4A; font-size: 15px; line-height: 1.6;">
                    ${textoPrincipalHtml}
                  </p>

                  ${blocoDestaqueHtml}

                  ${
                    textoSecundarioHtml
                      ? `<p style="margin: 14px 0; color: #4A4A4A; font-size: 15px; line-height: 1.6;">${textoSecundarioHtml}</p>`
                      : ''
                  }

                  ${botaoPrincipalHtml}
                  ${blocoAlertaHtml}
                </td>
              </tr>

              <!-- Rodapé -->
              <tr>
                <td style="background-color: #EFECE6; border-top: 1px solid #E2DDD5; padding: 16px 20px; text-align: center;">
                  <p style="margin: 0; color: #6E655F; font-size: 13px; font-style: italic;">
                    Equipe Ateliê Entre Linhas
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// 1. E-mail de Alerta de Novo Acesso
function gerarEmailAlertaLogin({ nomeUsuario, dataHoraAcesso, linkRedefinicao, urlEsqueciSenha }) {
  const temTokenDireto = Boolean(linkRedefinicao);

  return gerarLayoutEmailBase({
    nomeUsuario,
    textoPrincipalHtml:
      'Passando para avisar que registramos uma nova entrada no portal do <strong>Ateliê Entre Linhas</strong>.',
    destaqueLabel: 'HORÁRIO DO ACESSO',
    destaqueValorHtml: escaparHtml(dataHoraAcesso),
    textoSecundarioHtml: 'Se foi você quem acabou de entrar, está tudo certo!',
    blocoAlerta: {
      titulo: 'Não foi você que acessou?',
      descricao: temTokenDireto
        ? 'Este link seguro é válido por 1 hora para redefinir sua senha:'
        : 'Caso não reconheça este acesso, recomendamos redefinir sua senha imediatamente:',
      botaoTexto: 'Alterar Minha Senha Agora',
      botaoUrl: linkRedefinicao || urlEsqueciSenha
    }
  });
}

// 2. E-mail de Redefinição de Senha
function gerarEmailRecuperacao({ nomeUsuario, linkRedefinicao }) {
  return gerarLayoutEmailBase({
    nomeUsuario,
    textoPrincipalHtml:
      'Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Ateliê Entre Linhas</strong>.',
    textoSecundarioHtml:
      'Se você não solicitou essa alteração, pode ignorar este e-mail com segurança — sua senha atual permanecerá ativa.',
    blocoAlerta: {
      titulo: 'Redefinição de Senha',
      descricao: 'Este link seguro é válido por 1 hora para cadastrar uma nova senha:',
      botaoTexto: 'Alterar Minha Senha Agora',
      botaoUrl: linkRedefinicao
    }
  });
}

// 3. E-mail de Notificações (Propostas, Provas, Status, Chat, Lembretes, Avaliações)
function gerarEmailNotificacao({ nomeUsuario, titulo, mensagem, idPedido, urlPortal }) {
  const mensagemFormatadaHtml = escaparHtml(mensagem || '').replace(/\n/g, '<br/>');
  const labelDestaque = idPedido ? `${titulo} • PEDIDO #${idPedido}` : titulo;

  return gerarLayoutEmailBase({
    nomeUsuario,
    textoPrincipalHtml:
      'Você recebeu uma nova atualização no portal do <strong>Ateliê Entre Linhas</strong>:',
    destaqueLabel: labelDestaque,
    destaqueValorHtml: mensagemFormatadaHtml,
    textoSecundarioHtml: 'Acesse a plataforma para acompanhar os detalhes completos e responder.',
    botaoTexto: 'Acessar Ateliê Entre Linhas',
    botaoUrl: urlPortal
  });
}

module.exports = {
  gerarLayoutEmailBase,
  gerarEmailAlertaLogin,
  gerarEmailRecuperacao,
  gerarEmailNotificacao
};