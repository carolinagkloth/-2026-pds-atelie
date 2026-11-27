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

whatsappClient.on('disconnected', async (reason) => {
  console.log('⚠️ WhatsApp desconectado:', reason);
  try {
    // Encerra o navegador do Puppeteer para liberar o lock dos arquivos da pasta .wwebjs_auth
    await whatsappClient.destroy();
  } catch (err) {
    console.error('Erro ao encerrar navegador do WhatsApp:', err.message);
  }

  // Tenta re-inicializar após 3 segundos
  setTimeout(() => {
    whatsappClient.initialize().catch((err) => console.error('Erro ao reativar WhatsApp:', err.message));
  }, 3000);
});

whatsappClient.on('auth_failure', (msg) => {
  console.error('❌ Falha na autenticação do WhatsApp:', msg);
});

whatsappClient.initialize().catch((err) => {
  console.error('⚠️ Aviso: Falha na inicialização do WhatsApp Web:', err.message);
});

module.exports = whatsappClient; 