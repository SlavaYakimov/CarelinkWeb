import type { components } from '@/server/gateway/types.gen';
import { STICKY_NOTE_ENVELOPE_FORMAT } from '@/lib/sticky-notes/constants';
import { base64UrlToBytes, bytesToBase64Url } from '@/lib/sticky-notes/base64url';
import { getFamilyContentKeyProvider } from '@/lib/sticky-notes/family-key';

export type StickyNoteEnvelope = components['schemas']['StickyNoteEnvelope'];

function hkdfInfo(familyId: string): Uint8Array {
  return new TextEncoder().encode(`carelink:sticky-note:v1:${familyId}`);
}

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function deriveAesKey(
  rawKeyMaterial: Uint8Array,
  salt: Uint8Array,
  familyId: string,
): Promise<CryptoKey> {
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
      salt: asBufferSource(salt),
      info: asBufferSource(hkdfInfo(familyId)),
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
}): Promise<StickyNoteEnvelope> {
  const raw =
    params.rawKeyMaterial ??
    (await getFamilyContentKeyProvider().getRawKeyMaterial(params.familyId));
  if (!raw) {
    throw new Error('FAMILY_CONTENT_KEY_UNAVAILABLE');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveAesKey(raw, salt, params.familyId);
  const encoded = new TextEncoder().encode(params.plaintext);
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: asBufferSource(iv) },
    aesKey,
    encoded,
  );

  return {
    format: STICKY_NOTE_ENVELOPE_FORMAT,
    ciphertext: bytesToBase64Url(new Uint8Array(ciphertextBuf)),
    iv: bytesToBase64Url(iv),
    salt: bytesToBase64Url(salt),
  };
}

export async function decryptStickyNoteEnvelope(params: {
  familyId: string;
  envelope: StickyNoteEnvelope;
  rawKeyMaterial?: Uint8Array | null;
}): Promise<string> {
  const raw =
    params.rawKeyMaterial ??
    (await getFamilyContentKeyProvider().getRawKeyMaterial(params.familyId));
  if (!raw) {
    throw new Error('FAMILY_CONTENT_KEY_UNAVAILABLE');
  }

  const salt = base64UrlToBytes(params.envelope.salt);
  const iv = base64UrlToBytes(params.envelope.iv);
  const ciphertext = base64UrlToBytes(params.envelope.ciphertext);
  const aesKey = await deriveAesKey(raw, salt, params.familyId);
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: asBufferSource(iv) },
    aesKey,
    asBufferSource(ciphertext),
  );
  return new TextDecoder().decode(plainBuf);
}
