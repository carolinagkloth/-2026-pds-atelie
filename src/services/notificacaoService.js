const pool = require('../config/database');
const whatsappClient = require('../config/whatsapp');
const { enviarEmail } = require('./emailService');
const { gerarEmailNotificacao } = require('./emailTemplates');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

async function enviarMensagemWhatsapp(telefone, texto) {
  try {
    if (!telefone || !whatsappClient) return;

    if (!whatsappClient.estaPronto) {
      console.log(`[WhatsApp] Ignorando envio para ${telefone}: cliente aguardando leitura do QR Code.`);
      return;
    }

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

    // 3. Envio de E-mail com o layout padronizado
    if (mapaEmail[tipo] !== false && usuario.email) {
      const urlPortal = idPedido ? `${FRONTEND_URL}/?pedido=${idPedido}` : FRONTEND_URL;
      const htmlEmail = gerarEmailNotificacao({
        nomeUsuario: usuario.nome,
        titulo,
        mensagem,
        idPedido,
        urlPortal
      });

      enviarEmail(
        usuario.email,
        `${titulo} - Ateliê Entre Linhas`,
        `Olá, ${usuario.nome}!\n\n${titulo}\n${mensagem}\n\nAcesse: ${urlPortal}`,
        htmlEmail
      );
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