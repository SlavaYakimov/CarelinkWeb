import { describe, it, expect, afterEach } from 'vitest';
import { resetEnvCacheForTests } from '@/env';
import { parseDurationToSeconds } from '@/server/session/duration';

/** Mirrors setSessionCookie maxAge rule (Q6). */
function sessionCookieMaxAgeSeconds(guestMode: boolean, idleTtl: string): number | undefined {
  if (guestMode) return undefined;
  return parseDurationToSeconds(idleTtl);
}

describe('session cookie policy (Q6)', () => {
  afterEach(() => resetEnvCacheForTests());

  it('trusted device uses idle TTL for cookie max-age', () => {
    expect(sessionCookieMaxAgeSeconds(false, '7d')).toBe(7 * 24 * 3600);
  });

  it('guest mode omits max-age (session cookie)', () => {
    expect(sessionCookieMaxAgeSeconds(true, '7d')).toBeUndefined();
  });
});
