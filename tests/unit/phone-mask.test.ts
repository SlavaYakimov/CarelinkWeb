import { describe, it, expect } from 'vitest';
import { maskRuPhoneE164 } from '@/lib/phone';

describe('maskRuPhoneE164', () => {
  it('masks middle digits', () => {
    expect(maskRuPhoneE164('+79161234567')).toBe('+7 916 ***-**-67');
  });
});
