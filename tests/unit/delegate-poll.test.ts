import { describe, it, expect } from 'vitest';
import { interpretDelegateStatus, nextDelegatePollDelayMs } from '@/server/flows/delegate-poll';

describe('delegate poll', () => {
  it('computes exponential backoff capped at 15s', () => {
    expect(nextDelegatePollDelayMs(0)).toBe(2000);
    expect(nextDelegatePollDelayMs(3)).toBe(15000);
    expect(nextDelegatePollDelayMs(10)).toBe(15000);
  });

  it('returns approved only when deviceSession present', () => {
    expect(interpretDelegateStatus('approved', 'ds-1', 0)).toEqual({
      kind: 'approved',
      deviceSession: 'ds-1',
    });
    expect(interpretDelegateStatus('approved', undefined, 1)).toEqual({
      kind: 'pending',
      nextPollMs: 4000,
    });
  });

  it('maps terminal states', () => {
    expect(interpretDelegateStatus('rejected', undefined, 0)).toEqual({ kind: 'rejected' });
    expect(interpretDelegateStatus('expired', undefined, 0)).toEqual({ kind: 'expired' });
  });
});
