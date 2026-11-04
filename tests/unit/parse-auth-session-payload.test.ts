import { describe, expect, it } from 'vitest';
import {
  InvalidAuthSessionPayloadError,
  parseAuthSessionPayload,
} from '@/server/session/parse-auth-session-payload';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';

const familyId = '33333333-3333-3333-3333-333333333333';
const sessionBody = {
  defaultFamilyId: familyId,
  userRefresh: 'ur-1',
  families: [
    {
      familyId,
      access: 'access-jwt',
      refresh: 'fr-1',
      expiresAt: 1_700_000_000_000,
    },
  ],
};

describe('parseAuthSessionPayload', () => {
  it('accepts bare AuthSessionResponse', () => {
    const parsed = parseAuthSessionPayload(sessionBody);
    expect(parsed.userRefresh).toBe('ur-1');
    expect(parsed.families).toHaveLength(1);
  });

  it('unwraps { session: AuthSessionResponse } from rebuild', () => {
    const parsed = parseAuthSessionPayload({ session: sessionBody });
    expect(parsed.defaultFamilyId).toBe(familyId);
    expect(parsed.families[0]?.refresh).toBe('fr-1');
  });

  it('maps session into SessionRecord without throwing when families is array', () => {
    const auth = parseAuthSessionPayload({ session: sessionBody });
    const record = sessionRecordFromAuthResponse(auth, { deviceSession: 'ds' });
    expect(record.families[familyId]?.access).toBe('access-jwt');
  });

  it('treats non-array families as empty list', () => {
    const parsed = parseAuthSessionPayload({
      defaultFamilyId: familyId,
      userRefresh: 'ur',
      families: null,
    });
    expect(parsed.families).toEqual([]);
  });

  it('throws InvalidAuthSessionPayloadError when payload is invalid', () => {
    expect(() => parseAuthSessionPayload(null)).toThrow(InvalidAuthSessionPayloadError);
  });
});
