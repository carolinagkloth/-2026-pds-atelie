const { Client, LocalAuth } = require('whatsapp-web.js');

const whatsappClient = new Client({
  authStrategy: new LocalAuth({
    dataPath: './.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    protocolTimeout: 180000,
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

whatsappClient.ultimoQr = null;
whatsappClient.estaPronto = false;

let reinicializando = false;

whatsappClient.on('qr', (qr) => {
  whatsappClient.ultimoQr = qr;
  whatsappClient.estaPronto = false;
  console.log('📲 Novo QR Code gerado! Acesse /qr-whatsapp no navegador para escanear.');
});

whatsappClient.on('ready', () => {
  whatsappClient.ultimoQr = null;
  whatsappClient.estaPronto = true;
  reinicializando = false;
  console.log('✅ WhatsApp do Ateliê conectado com sucesso e pronto para envio!');
});

whatsappClient.on('auth_failure', (msg) => {
  whatsappClient.estaPronto = false;
  console.error('❌ Falha na autenticação do WhatsApp:', msg);
});

whatsappClient.on('disconnected', async (reason) => {
  whatsappClient.estaPronto = false;
  console.warn('⚠️ WhatsApp desconectado:', reason);

  if (reinicializando) return;
  reinicializando = true;

  try {
    await whatsappClient.destroy();
  } catch (err) {
    console.error('Erro ao destruir sessão antiga do WhatsApp:', err.message);
  }

  setTimeout(() => {
    whatsappClient
      .initialize()
      .catch((err) => console.error('Erro ao reinicializar WhatsApp:', err.message))
      .finally(() => {
        reinicializando = false;
      });
  }, 5000);
});

whatsappClient.initialize().catch((err) => {
  console.error('Erro na inicialização do WhatsApp:', err.message);
});

module.exports = whatsappClient;