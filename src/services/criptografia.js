const crypto = require('crypto');

const ALGORITMO = 'aes-256-gcm';
const PREFIXO = 'enc:v1:';

function obterChave() {
  const segredo = process.env.CHAVE_CRIPTOGRAFIA || process.env.JWT_SECRET || 'atelie_entre_linhas_lgpd_2026';
  return crypto.createHash('sha256').update(String(segredo)).digest();
}

function criptografar(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return null;
  }
  const texto = String(valor).trim();
  if (texto.startsWith(PREFIXO)) return texto;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITMO, obterChave(), iv);
  const criptografado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIXO}${iv.toString('hex')}:${tag.toString('hex')}:${criptografado.toString('hex')}`;
}

function descriptografar(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return valor;
  }
  const texto = String(valor);
  if (!texto.startsWith(PREFIXO)) return texto;

  try {
    const partes = texto.slice(PREFIXO.length).split(':');
    if (partes.length !== 3) return '';
    const [ivHex, tagHex, dadosHex] = partes;
    const decipher = crypto.createDecipheriv(ALGORITMO, obterChave(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decifrado = Buffer.concat([
      decipher.update(Buffer.from(dadosHex, 'hex')),
      decipher.final()
    ]);
    return decifrado.toString('utf8');
  } catch (err) {
    console.error('Erro ao descriptografar campo sensível:', err.message);
    return '';
  }
}

module.exports = { criptografar, descriptografar };