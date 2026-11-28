const { Client, LocalAuth } = require('whatsapp-web.js');

let reinicializando = false;

const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    headless: true,
    protocolTimeout: 180000, // 3 minutos para evitar "Runtime.callFunctionOn timed out" sob carga
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // evita travar por falta de memória /dev/shm no container
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--js-flags=--max-old-space-size=256'
    ]
  }
});

whatsappClient.ultimoQr = null;

whatsappClient.on('qr', (qr) => {
  whatsappClient.ultimoQr = qr;
  console.log('📲 Novo QR Code gerado! Acesse /qr-whatsapp no navegador para escanear.');
});

whatsappClient.on('ready', () => {
  whatsappClient.ultimoQr = null;
  reinicializando = false;
  console.log('✅ WhatsApp do Ateliê conectado com sucesso e pronto para envio!');
});

whatsappClient.on('disconnected', async (reason) => {
  console.log('⚠️ WhatsApp desconectado:', reason);
  if (reinicializando) return;
  reinicializando = true;

  try {
    await whatsappClient.destroy();
  } catch (err) {
    console.error('Erro ao encerrar navegador do WhatsApp:', err.message);
  }

  setTimeout(() => {
    whatsappClient
      .initialize()
      .catch((err) => console.error('Erro ao reativar WhatsApp:', err.message))
      .finally(() => {
        reinicializando = false;
      });
  }, 5000);
});

whatsappClient.on('auth_failure', (msg) => {
  reinicializando = false;
  console.error('❌ Falha na autenticação do WhatsApp:', msg);
});

setTimeout(() => {
  whatsappClient.initialize().catch((err) => {
    console.error('⚠️ Aviso: Falha na inicialização do WhatsApp Web:', err.message);
  });
}, 15000);

module.exports = whatsappClient;