import { describe, it, expect } from 'vitest';
import { formatRuPhoneDisplay, normalizeRuPhone } from '@/lib/phone';

describe('phone helpers', () => {
  it('formats +7 mask while typing', () => {
    expect(formatRuPhoneDisplay('79001234567')).toBe('+7 (900) 123-45-67');
  });

  it('normalizes to E.164', () => {
    expect(normalizeRuPhone('+7 (900) 123-45-67')).toBe('+79001234567');
    expect(normalizeRuPhone('89001234567')).toBe('+79001234567');
    expect(normalizeRuPhone('123')).toBeNull();
  });
});
