import { z } from 'zod';
import { base64ToBytes } from '@/lib/sticky-notes/base64';
import {
  STICKY_NOTE_MAX_DOODLE_CIPHERTEXT_BYTES,
  STICKY_NOTE_MAX_REQUEST_BODY_BYTES,
  STICKY_NOTE_MAX_TEXT_CIPHERTEXT_BYTES,
  STICKY_NOTE_UI_MAX_PLAINTEXT_CHARS,
} from '@/lib/sticky-notes/constants';

export const stickyNotePlaintextSchema = z
  .string()
  .min(1, 'Введите текст записки')
  .max(
    STICKY_NOTE_UI_MAX_PLAINTEXT_CHARS,
    `Не больше ${STICKY_NOTE_UI_MAX_PLAINTEXT_CHARS} символов`,
  );

const contentEnvelopeSchema = z
  .object({
    v: z.literal(1),
    alg: z.literal('AES-256-GCM'),
    kdf: z.literal('HKDF-SHA256'),
    kid: z.string().min(1),
    nonce: z.string().min(1),
  })
  .passthrough();

export const sendStickyNoteFormSchema = z.object({
  familyId: z.string().uuid(),
  recipientUserId: z.string().uuid(),
  clientNoteId: z.string().uuid(),
  plaintext: stickyNotePlaintextSchema,
});

export const sendStickyNotePayloadSchema = z.object({
  familyId: z.string().uuid(),
  recipientUserId: z.string().uuid(),
  clientNoteId: z.string().uuid(),
  contentType: z.enum(['text', 'doodle']),
  contentCiphertext: z.string().min(1),
  contentEnvelope: contentEnvelopeSchema,
});

export function assertStickyNoteRequestSize(payload: z.infer<typeof sendStickyNotePayloadSchema>) {
  const approxBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (approxBytes > STICKY_NOTE_MAX_REQUEST_BODY_BYTES) {
    throw new Error('STICKY_NOTE_BODY_TOO_LARGE');
  }
  const cipherBytes = base64ToBytes(payload.contentCiphertext).length;
  const max =
    payload.contentType === 'doodle'
      ? STICKY_NOTE_MAX_DOODLE_CIPHERTEXT_BYTES
      : STICKY_NOTE_MAX_TEXT_CIPHERTEXT_BYTES;
  if (cipherBytes > max) {
    throw new Error('STICKY_NOTE_CIPHERTEXT_TOO_LARGE');
  }
}
