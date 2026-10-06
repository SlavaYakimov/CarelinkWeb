import { describe, it, expect } from 'vitest';
import { userIdFromAccessToken } from '@/server/auth/jwt-sub';

function fakeJwt(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none' }), 'utf8').toString('base64url');
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${header}.${body}.sig`;
}

describe('userIdFromAccessToken', () => {
  it('reads sub claim', () => {
    const token = fakeJwt({ sub: '11111111-1111-1111-1111-111111111111' });
    expect(userIdFromAccessToken(token)).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('returns null for malformed token', () => {
    expect(userIdFromAccessToken('not-a-jwt')).toBeNull();
  });
});
