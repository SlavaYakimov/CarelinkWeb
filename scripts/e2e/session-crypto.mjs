import { createCipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';
const NONCE_LEN = 12;

function decodeKey(base64, label) {
  const buf = Buffer.from(base64, 'base64');
  if (buf.length !== 32) {
    throw new Error(`${label} must decode to 32 bytes`);
  }
  return buf;
}

export function encryptJson(value, keyBase64) {
  const key = decodeKey(keyBase64, 'SESSION_ENC_KEY');
  const nonce = randomBytes(NONCE_LEN);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([nonce, encrypted, tag]).toString('base64url');
  return `${VERSION}:${payload}`;
}
