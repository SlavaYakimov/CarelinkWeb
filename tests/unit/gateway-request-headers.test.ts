import { describe, expect, it } from 'vitest';
import { buildGatewayRequestHeaders } from '@/server/gateway/build-request-headers';
import type { SessionRecord } from '@/server/session/types';

function session(partial: Partial<SessionRecord>): SessionRecord {
  return {
    userId: 'u',
    defaultFamilyId: 'd',
    activeFamilyId: 'fam-a',
    userRefresh: 'user-refresh-token',
    families: {
      'fam-a': {
        access: 'family-access-jwt',
        refresh: 'fr',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      },
    },
    deviceSession: 'ds',
    createdAt: '',
    lastSeenAt: '',
    ...partial,
  };
}

describe('buildGatewayRequestHeaders', () => {
  it('member-invites pending: Bearer family access, no X-User-Refresh', () => {
    const headers = buildGatewayRequestHeaders({
      session: session({}),
      traceId: 'trace-1',
      clientIp: '127.0.0.1',
      userScopedRequest: true,
      bearerOnlyUserRoute: true,
      userRefreshHeader: true,
    });
    expect(headers.Authorization).toBe('Bearer family-access-jwt');
    expect(headers['X-User-Refresh']).toBeUndefined();
  });

  it('session rebuild: sends X-User-Refresh when not bearer-only', () => {
    const headers = buildGatewayRequestHeaders({
      session: session({}),
      traceId: 'trace-2',
      clientIp: '127.0.0.1',
      userRefreshHeader: true,
    });
    expect(headers['X-User-Refresh']).toBe('user-refresh-token');
  });

  it('userScopedRequest picks family with access when activeFamilyId lacks tokens', () => {
    const famId = '11111111-1111-4111-8111-111111111111';
    const headers = buildGatewayRequestHeaders({
      session: session({
        activeFamilyId: '00000000-0000-4000-8000-000000000000',
        families: {
          [famId]: {
            access: 'other-family-jwt',
            refresh: 'r',
            expiresAt: new Date(Date.now() + 3600_000).toISOString(),
          },
        },
      }),
      traceId: 'trace-3',
      clientIp: '127.0.0.1',
      userScopedRequest: true,
      bearerOnlyUserRoute: true,
    });
    expect(headers.Authorization).toBe('Bearer other-family-jwt');
  });
});
