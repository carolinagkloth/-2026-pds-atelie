const whatsappClient = require('../config/whatsapp');

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

module.exports = { enviarMensagemWhatsapp };