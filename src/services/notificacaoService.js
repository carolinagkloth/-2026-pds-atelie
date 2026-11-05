const pool = require('../config/database');
const whatsappClient = require('../config/whatsapp');
const { transporter, EMAIL_OFICIAL } = require('./emailService');

async function enviarMensagemWhatsapp(telefone, texto) {
  try {
    if (!telefone || !whatsappClient) return;

    let limpo = telefone.replace(/\D/g, '');

    if (limpo.length === 10 || limpo.length === 11) {
      limpo = '55' + limpo;
    }

    const numberDetails = await whatsappClient.getNumberId(limpo);

    if (!numberDetails) {
      console.error(`[WhatsApp Erro] O número ${telefone} (${limpo}) não tem conta ativa no WhatsApp.`);
      return;
    }

    await whatsappClient.sendMessage(numberDetails._serialized, texto);
    console.log(`[WhatsApp] Mensagem enviada com sucesso para ${telefone}!`);
  } catch (err) {
    console.error(`[WhatsApp Erro] Falha ao enviar para ${telefone}:`, err.message);
  }
}

async function dispararNotificacao({ idUsuario, titulo, mensagem, tipo, idPedido = null, forcarWhatsapp = false }) {
  try {
    // 1. Notificação no site (Sininho)
    await pool.query(
      `INSERT INTO notificacoes (id_usuario, titulo, mensagem, tipo, id_pedido)
       VALUES ($1, $2, $3, $4, $5)`,
      [idUsuario, titulo, mensagem, tipo, idPedido]
    );

    // 2. Busca usuário e preferências
    const userRes = await pool.query('SELECT email, nome, telefone FROM usuarios WHERE id_usuario = $1', [idUsuario]);
    if (userRes.rows.length === 0) return;
    const usuario = userRes.rows[0];

    let prefRes = await pool.query('SELECT * FROM configuracoes_notificacoes WHERE id_usuario = $1', [idUsuario]);
    let prefs = prefRes.rows[0];
    if (!prefs) {
      const ins = await pool.query('INSERT INTO configuracoes_notificacoes (id_usuario) VALUES ($1) RETURNING *', [idUsuario]);
      prefs = ins.rows[0];
    }

    const mapaEmail = {
      proposta: prefs.notif_proposta,
      chat: prefs.notif_chat,
      prova: prefs.notif_prova,
      status: prefs.notif_status,
      lembrete: prefs.notif_lembrete,
      avaliacao: prefs.notif_avaliacao,
      cancelamento: prefs.notif_cancelamento
    };

    // 3. Envio de E-mail
    if (mapaEmail[tipo] !== false && usuario.email) {
      transporter.sendMail({
        from: `"Ateliê Entre Linhas" <${EMAIL_OFICIAL}>`,
        to: usuario.email,
        subject: `Ateliê - ${titulo}`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                 <h2 style="color: #3E2445;">Olá, ${usuario.nome}!</h2>
                 <p style="font-size: 14px; color: #333;">${mensagem}</p>
                 <br/><small style="color: #888;">Ateliê Entre Linhas</small>
               </div>`
      }).catch((err) => console.error('Erro ao enviar e-mail:', err));
    }

    // 4. Envio de WhatsApp (se for evento crítico + permissão)
    if (forcarWhatsapp && prefs.receber_whatsapp !== false && usuario.telefone) {
      const textoZap = `🧵 *Ateliê Entre Linhas*\nOlá, ${usuario.nome}!\n\n📌 *${titulo}*\n${mensagem}`;
      await enviarMensagemWhatsapp(usuario.telefone, textoZap);
    }
  } catch (err) {
    console.error('Erro ao disparar notificação:', err);
  }
}

module.exports = { dispararNotificacao, enviarMensagemWhatsapp };