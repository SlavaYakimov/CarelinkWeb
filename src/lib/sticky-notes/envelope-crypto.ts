import type { components } from '@/server/gateway/types.gen';
import { base64ToBytes, bytesToBase64 } from '@/lib/sticky-notes/base64';
import {
  STICKY_NOTE_HKDF_INFO,
  STICKY_NOTE_HKDF_SALT_BYTES,
  STICKY_NOTE_MAX_TEXT_CIPHERTEXT_BYTES,
  STICKY_NOTE_STUB_KID,
} from '@/lib/sticky-notes/constants';
import { getFamilyContentKeyProvider } from '@/lib/sticky-notes/family-key';

export type StickyNoteContentEnvelope = components['schemas']['StickyNoteContentEnvelope'];
export type StickyNote = components['schemas']['StickyNote'];

export type EncryptStickyNoteResult = {
  contentType: 'text';
  contentCiphertext: string;
  contentEnvelope: StickyNoteContentEnvelope;
};

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function hkdfInfoBytes(): Uint8Array {
  return new TextEncoder().encode(STICKY_NOTE_HKDF_INFO);
}

async function deriveAesKey(rawKeyMaterial: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    asBufferSource(rawKeyMaterial),
    'HKDF',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: asBufferSource(STICKY_NOTE_HKDF_SALT_BYTES),
      info: asBufferSource(hkdfInfoBytes()),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptStickyNotePlaintext(params: {
  familyId: string;
  plaintext: string;
  rawKeyMaterial?: Uint8Array | null;
  kid?: string;
}): Promise<EncryptStickyNoteResult> {
  const raw =
    params.rawKeyMaterial ??
    (await getFamilyContentKeyProvider().getRawKeyMaterial(params.familyId));
  if (!raw) {
    throw new Error('FAMILY_CONTENT_KEY_UNAVAILABLE');
  }

  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveAesKey(raw);
  const encoded = new TextEncoder().encode(params.plaintext);
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: asBufferSource(nonce) },
    aesKey,
    encoded,
  );
  const ciphertextBytes = new Uint8Array(ciphertextBuf);
  if (ciphertextBytes.length > STICKY_NOTE_MAX_TEXT_CIPHERTEXT_BYTES) {
    throw new Error('STICKY_NOTE_CIPHERTEXT_TOO_LARGE');
  }

  return {
    contentType: 'text',
    contentCiphertext: bytesToBase64(ciphertextBytes),
    contentEnvelope: {
      v: 1,
      alg: 'AES-256-GCM',
      kdf: 'HKDF-SHA256',
      kid: params.kid ?? STICKY_NOTE_STUB_KID,
      nonce: bytesToBase64(nonce),
    },
  };
}

export async function decryptStickyNoteContent(params: {
  familyId: string;
  contentCiphertext: string;
  contentEnvelope: StickyNoteContentEnvelope;
  rawKeyMaterial?: Uint8Array | null;
}): Promise<string> {
  const raw =
    params.rawKeyMaterial ??
    (await getFamilyContentKeyProvider().getRawKeyMaterial(params.familyId));
  if (!raw) {
    throw new Error('FAMILY_CONTENT_KEY_UNAVAILABLE');
  }

  const nonce = base64ToBytes(params.contentEnvelope.nonce);
  if (nonce.length !== 12) {
    throw new Error('STICKY_NOTE_INVALID_NONCE');
  }
  const ciphertext = base64ToBytes(params.contentCiphertext);
  const aesKey = await deriveAesKey(raw);
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: asBufferSource(nonce) },
    aesKey,
    asBufferSource(ciphertext),
  );
  return new TextDecoder().decode(plainBuf);
}
