import 'server-only';

export type DelegatePollStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type DelegatePollOutcome =
  | { kind: 'pending'; nextPollMs: number }
  | { kind: 'approved'; deviceSession: string }
  | { kind: 'rejected' }
  | { kind: 'expired' };

/** Backoff for client polling delegate-status (ms). */
export function nextDelegatePollDelayMs(attempt: number): number {
  const base = 2000;
  const cap = 15000;
  const exp = Math.min(cap, base * 2 ** Math.min(attempt, 3));
  return exp;
}

export function interpretDelegateStatus(
  status: DelegatePollStatus,
  deviceSession: string | undefined,
  attempt: number,
): DelegatePollOutcome {
  if (status === 'approved') {
    if (!deviceSession) {
      return { kind: 'pending', nextPollMs: nextDelegatePollDelayMs(attempt) };
    }
    return { kind: 'approved', deviceSession };
  }
  if (status === 'rejected') return { kind: 'rejected' };
  if (status === 'expired') return { kind: 'expired' };
  return { kind: 'pending', nextPollMs: nextDelegatePollDelayMs(attempt) };
}
