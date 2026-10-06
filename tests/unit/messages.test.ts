import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '@/lib/messages';

describe('getErrorMessage', () => {
  it('returns Russian text for known codes', () => {
    expect(getErrorMessage('RATE_LIMIT')).toContain('Слишком много');
    expect(getErrorMessage('INVALID_CREDENTIALS')).toContain('Неверный');
    expect(getErrorMessage('DEVICE_NOT_VERIFIED')).toContain('SMS');
  });

  it('falls back to UNKNOWN', () => {
    expect(getErrorMessage('NOT_A_REAL_CODE')).toContain('Что-то пошло не так');
    expect(getErrorMessage(null)).toContain('Что-то пошло не так');
  });
});
