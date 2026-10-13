import { describe, expect, it } from 'vitest';
import { formatJoinLinkShortCode } from '@/lib/join/format-short-code';

describe('formatJoinLinkShortCode', () => {
  it('formats opaque token for keeper display', () => {
    expect(formatJoinLinkShortCode('k7m4qx9abcdef')).toBe('K7M-4QX9');
  });
});
