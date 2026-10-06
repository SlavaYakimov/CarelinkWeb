import { describe, it, expect } from 'vitest';
import { decryptJson, encryptJson } from '@/server/session/crypto';

const KEY_A = Buffer.alloc(32, 1).toString('base64');
const KEY_B = Buffer.alloc(32, 2).toString('base64');

describe('session crypto', () => {
  it('round-trips JSON', () => {
    const blob = encryptJson({ hello: 'world' }, KEY_A);
    const { data, reencrypt } = decryptJson<{ hello: string }>(blob, KEY_A);
    expect(data.hello).toBe('world');
    expect(reencrypt).toBe(false);
  });

  it('decrypts with previous key and flags reencrypt', () => {
    const blob = encryptJson({ n: 42 }, KEY_A);
    const { data, reencrypt } = decryptJson<{ n: number }>(blob, KEY_B, KEY_A);
    expect(data.n).toBe(42);
    expect(reencrypt).toBe(true);
  });
});
