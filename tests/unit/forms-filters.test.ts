import { describe, expect, it } from 'vitest';
import { filterEmail, filterOtp, filterSlug, formatPhoneKeepCaret } from '@/lib/forms/filters';

describe('forms filters', () => {
  it('filterSlug lowercases and maps space to hyphen', () => {
    expect(filterSlug('Ivanov Y').value).toBe('ivanov-y');
  });

  it('filterSlug rejects cyrillic', () => {
    const r = filterSlug('семья');
    expect(r.value).toBe('');
    expect(r.rejectedCyrillic).toBe(true);
  });

  it('filterSlug collapses double hyphen and caps length', () => {
    expect(filterSlug('a--b').value).toBe('a-b');
    expect(filterSlug('x'.repeat(40)).value.length).toBe(32);
  });

  it('filterOtp strips non-digits', () => {
    expect(filterOtp('123-456')).toBe('123456');
    expect(filterOtp('12 34 56')).toBe('123456');
    expect(filterOtp('12ab34')).toBe('1234');
  });

  it('filterEmail removes spaces', () => {
    expect(filterEmail('a @b.com')).toBe('a@b.com');
  });

  it('formatPhoneKeepCaret preserves digit index on edit', () => {
    const prev = '+7 (912) 345-67-89';
    const next = formatPhoneKeepCaret(prev, '+7 (912) 345-67-8', 20, 20);
    expect(next.display).toContain('912');
    expect(next.digitCount).toBe(9);
  });
});
