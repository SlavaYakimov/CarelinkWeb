import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  decryptStickyNoteContent,
  encryptStickyNotePlaintext,
} from '@/lib/sticky-notes/envelope-crypto';
import {
  setFamilyContentKeyProvider,
  stubFamilyContentKeyProvider,
  testFamilyContentKeyProvider,
} from '@/lib/sticky-notes/family-key';

const KEY_B64 = Buffer.alloc(32, 7).toString('base64');
const familyId = '11111111-1111-4111-8111-111111111111';

describe('sticky-note envelope crypto', () => {
  beforeEach(() => {
    setFamilyContentKeyProvider(testFamilyContentKeyProvider(KEY_B64));
  });

  afterEach(() => {
    setFamilyContentKeyProvider(stubFamilyContentKeyProvider);
  });

  it('round-trips unicode plaintext without mutation', async () => {
    const plaintext = 'Привет,\n\tмир!  🌿';
    const encrypted = await encryptStickyNotePlaintext({ familyId, plaintext });
    const decoded = await decryptStickyNoteContent({
      familyId,
      contentCiphertext: encrypted.contentCiphertext,
      contentEnvelope: encrypted.contentEnvelope,
    });
    expect(decoded).toBe(plaintext);
  });

  it('stub provider rejects encrypt', async () => {
    setFamilyContentKeyProvider({ getRawKeyMaterial: async () => null });
    await expect(encryptStickyNotePlaintext({ familyId, plaintext: 'x' })).rejects.toThrow(
      'FAMILY_CONTENT_KEY_UNAVAILABLE',
    );
  });
});
