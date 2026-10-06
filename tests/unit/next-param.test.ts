import { describe, it, expect } from 'vitest';
import { sanitizeNextParam } from '@/server/security/next-param';

describe('sanitizeNextParam', () => {
  it('allows relative in-app paths', () => {
    expect(sanitizeNextParam('/families/abc')).toBe('/families/abc');
  });

  it('blocks open redirects', () => {
    expect(sanitizeNextParam('https://evil.example')).toBe('/families');
    expect(sanitizeNextParam('//evil.example')).toBe('/families');
  });
});
