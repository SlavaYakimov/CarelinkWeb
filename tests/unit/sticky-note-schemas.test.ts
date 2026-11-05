import { describe, it, expect } from 'vitest';
import { sendStickyNoteFormSchema } from '@/lib/sticky-notes/schemas';
import { STICKY_NOTE_UI_MAX_PLAINTEXT_CHARS } from '@/lib/sticky-notes/constants';

describe('sticky-note schemas', () => {
  it('rejects empty and over-limit plaintext', () => {
    const base = {
      familyId: '11111111-1111-4111-8111-111111111111',
      recipientUserId: '22222222-2222-4222-8222-222222222222',
      clientNoteId: '33333333-3333-4333-8333-333333333333',
    };
    expect(sendStickyNoteFormSchema.safeParse({ ...base, plaintext: '' }).success).toBe(false);
    expect(
      sendStickyNoteFormSchema.safeParse({
        ...base,
        plaintext: 'a'.repeat(STICKY_NOTE_UI_MAX_PLAINTEXT_CHARS + 1),
      }).success,
    ).toBe(false);
  });
});
