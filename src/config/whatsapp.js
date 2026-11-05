const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

whatsappClient.on('qr', (qr) => {
  console.log('\n==================================================');
  console.log('📲 ESCANEE O QR CODE ABAIXO PARA CONECTAR O WHATSAPP:');
  console.log('==================================================\n');
  qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
  console.log('✅ WhatsApp do Ateliê conectado com sucesso e pronto para envio!');
});

whatsappClient.on('disconnected', (reason) => {
  console.log('⚠️ WhatsApp desconectado:', reason);
  whatsappClient.initialize().catch((err) => console.error('Erro ao reativar WhatsApp:', err));
});

whatsappClient.on('auth_failure', (msg) => {
  console.error('❌ Falha na autenticação do WhatsApp:', msg);
});

whatsappClient.initialize().catch((err) => {
  console.error('⚠️ Aviso: Falha na inicialização do WhatsApp Web:', err.message);
});

module.exports = whatsappClient;