import { z } from 'zod';
import { STICKY_NOTE_MAX_PLAINTEXT_CHARS } from '@/lib/sticky-notes/constants';

export const stickyNotePlaintextSchema = z
  .string()
  .min(1, 'Введите текст записки')
  .max(STICKY_NOTE_MAX_PLAINTEXT_CHARS, `Не больше ${STICKY_NOTE_MAX_PLAINTEXT_CHARS} символов`);

const envelopeSchema = z.object({
  format: z.literal('aes-256-gcm-hkdf-sha256-v1'),
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
  salt: z.string().min(1),
  aad: z.string().optional(),
});

export const sendStickyNoteFormSchema = z.object({
  familyId: z.string().uuid(),
  recipientUserId: z.string().uuid(),
  clientNoteId: z.string().uuid(),
  plaintext: stickyNotePlaintextSchema,
});

export const sendStickyNotePayloadSchema = sendStickyNoteFormSchema
  .omit({ plaintext: true })
  .extend({
    envelope: envelopeSchema,
    plaintextCharCount: z.number().int().min(1).max(500),
  });
