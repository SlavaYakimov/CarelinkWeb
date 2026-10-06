import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';
const NONCE_LEN = 12;
const TAG_LEN = 16;

function decodeKey(base64: string, label: string): Buffer {
  const buf = Buffer.from(base64, 'base64');
  if (buf.length !== 32) {
    throw new Error(`${label} must decode to 32 bytes`);
  }
  return buf;
}

export function encryptJson(value: unknown, keyBase64: string): string {
  const key = decodeKey(keyBase64, 'SESSION_ENC_KEY');
  const nonce = randomBytes(NONCE_LEN);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([nonce, encrypted, tag]).toString('base64url');
  return `${VERSION}:${payload}`;
}

export function decryptJson<T>(
  blob: string,
  primaryKeyBase64: string,
  previousKeyBase64?: string,
): { data: T; reencrypt: boolean } {
  const [ver, payload] = blob.split(':');
  if (ver !== VERSION || !payload) {
    throw new Error('Unsupported ciphertext format');
  }
  const buf = Buffer.from(payload, 'base64url');
  if (buf.length < NONCE_LEN + TAG_LEN + 1) {
    throw new Error('Ciphertext too short');
  }
  const nonce = buf.subarray(0, NONCE_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const ciphertext = buf.subarray(NONCE_LEN, buf.length - TAG_LEN);

  const keys = [
    { key: primaryKeyBase64, reencrypt: false },
    ...(previousKeyBase64 ? [{ key: previousKeyBase64, reencrypt: true }] : []),
  ];

  let lastErr: Error | undefined;
  for (const { key: keyB64, reencrypt } of keys) {
    try {
      const key = decodeKey(keyB64, 'SESSION_ENC_KEY');
      const decipher = createDecipheriv('aes-256-gcm', key, nonce);
      decipher.setAuthTag(tag);
      const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return { data: JSON.parse(plain.toString('utf8')) as T, reencrypt };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('Decryption failed');
}
