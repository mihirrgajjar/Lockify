const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY       = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8'); // must be 32 chars
const IV_LENGTH = 16;

console.log('Encryption Key Debug:');
console.log('  Key string:', process.env.ENCRYPTION_KEY);
console.log('  Key length (chars):', process.env.ENCRYPTION_KEY?.length);
console.log('  Buffer length (bytes):', KEY.length);
console.log('  Expected: 32 bytes');

/**
 * Encrypt a plain text string
 * Returns:  "iv:encryptedText"
 */
function encrypt(text) {
  const iv        = crypto.randomBytes(IV_LENGTH);
  const cipher    = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt an encrypted string
 * Input:  "iv:encryptedText"
 */
function decrypt(encryptedText) {
  const [ivHex, dataHex] = encryptedText.split(':');
  const iv        = Buffer.from(ivHex,  'hex');
  const data      = Buffer.from(dataHex, 'hex');
  const decipher  = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };