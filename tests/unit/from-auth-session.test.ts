import { describe, it, expect } from 'vitest';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';

describe('sessionRecordFromAuthResponse', () => {
  it('maps families and expiry', () => {
    const userId = '22222222-2222-2222-2222-222222222222';
    const access = [
      Buffer.from(JSON.stringify({ alg: 'none' }), 'utf8').toString('base64url'),
      Buffer.from(JSON.stringify({ sub: userId }), 'utf8').toString('base64url'),
      'sig',
    ].join('.');

    const record = sessionRecordFromAuthResponse(
      {
        defaultFamilyId: '33333333-3333-3333-3333-333333333333',
        userRefresh: 'ur-1',
        families: [
          {
            familyId: '33333333-3333-3333-3333-333333333333',
            access,
            refresh: 'fr-1',
            expiresAt: 1_700_000_000_000,
          },
        ],
      },
      { deviceSession: 'ds-1' },
    );

    expect(record.userId).toBe(userId);
    expect(record.deviceSession).toBe('ds-1');
    expect(record.families['33333333-3333-3333-3333-333333333333']?.refresh).toBe('fr-1');
    expect(record.activeFamilyId).toBe('33333333-3333-3333-3333-333333333333');
  });
});
