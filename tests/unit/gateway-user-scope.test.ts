import { describe, expect, it } from 'vitest';
import { pickFamilyIdForBearer, sessionHasUserRefresh } from '@/server/gateway/user-scope';
import type { SessionRecord } from '@/server/session/types';

function session(partial: Partial<SessionRecord>): SessionRecord {
  return {
    userId: 'u',
    defaultFamilyId: 'd',
    activeFamilyId: 'active-missing',
    userRefresh: 'ur',
    families: {},
    deviceSession: 'ds',
    createdAt: '',
    lastSeenAt: '',
    ...partial,
  };
}

describe('pickFamilyIdForBearer', () => {
  it('prefers family with access when activeFamilyId has no tokens', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const sid = pickFamilyIdForBearer(
      session({
        activeFamilyId: '00000000-0000-4000-8000-000000000000',
        families: {
          [id]: { access: 'at', refresh: 'rt', expiresAt: new Date().toISOString() },
        },
      }),
    );
    expect(sid).toBe(id);
  });
});

describe('sessionHasUserRefresh', () => {
  it('detects missing user refresh', () => {
    expect(sessionHasUserRefresh(session({ userRefresh: 'x' }))).toBe(true);
    expect(sessionHasUserRefresh(session({ userRefresh: '  ' }))).toBe(false);
  });
});
