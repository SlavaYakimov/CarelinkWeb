import { describe, expect, it } from 'vitest';
import { joinUnavailableCopy, parseJoinUnavailableReason } from '@/lib/join/unavailable-reason';

describe('join unavailable screens', () => {
  it('maps R3 reason', () => {
    expect(parseJoinUnavailableReason('already_in_family')).toBe('already_in_family');
    const copy = joinUnavailableCopy('already_in_family');
    expect(copy.title).toContain('другой семье');
  });

  it('maps R4 reason', () => {
    const copy = joinUnavailableCopy('expired');
    expect(copy.title).toContain('устарело');
  });
});
