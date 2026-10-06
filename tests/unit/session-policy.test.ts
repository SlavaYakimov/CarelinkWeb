import { describe, it, expect, afterEach } from 'vitest';
import { resetEnvCacheForTests } from '@/env';
import { isSessionExpired } from '@/server/session/policy';
import type { SessionRecord } from '@/server/session/types';

const base: SessionRecord = {
  userId: 'u1',
  defaultFamilyId: 'f1',
  activeFamilyId: 'f1',
  userRefresh: 'ur',
  deviceSession: 'ds',
  families: {},
  createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  lastSeenAt: new Date('2026-01-01T00:00:00Z').toISOString(),
};

describe('isSessionExpired', () => {
  afterEach(() => {
    resetEnvCacheForTests();
  });

  it('expires after absolute TTL', () => {
    process.env.APP_ENV = 'development';
    process.env.APP_ORIGIN = 'http://localhost:3000';
    process.env.GATEWAY_URL = 'http://127.0.0.1:8088';
    process.env.REDIS_URL = 'redis://127.0.0.1:6379';
    process.env.SESSION_ENC_KEY = Buffer.alloc(32).toString('base64');
    process.env.SESSION_IDLE_TTL = '7d';
    process.env.SESSION_ABSOLUTE_TTL = '30d';
    process.env.SESSION_GUEST_TTL = '12h';
    process.env.FLOW_TTL = '15m';
    resetEnvCacheForTests();

    const active = {
      ...base,
      lastSeenAt: new Date('2026-01-19T12:00:00Z').toISOString(),
    };
    const now = Date.parse('2026-01-20T00:00:00Z');
    expect(isSessionExpired(active, now)).toBe(false);
    const nowLate = Date.parse('2026-02-15T00:00:00Z');
    expect(isSessionExpired(base, nowLate)).toBe(true);
  });

  it('guest mode uses shorter idle window', () => {
    process.env.APP_ENV = 'development';
    process.env.APP_ORIGIN = 'http://localhost:3000';
    process.env.GATEWAY_URL = 'http://127.0.0.1:8088';
    process.env.REDIS_URL = 'redis://127.0.0.1:6379';
    process.env.SESSION_ENC_KEY = Buffer.alloc(32).toString('base64');
    process.env.SESSION_IDLE_TTL = '7d';
    process.env.SESSION_ABSOLUTE_TTL = '30d';
    process.env.SESSION_GUEST_TTL = '12h';
    process.env.FLOW_TTL = '15m';
    resetEnvCacheForTests();

    const guest: SessionRecord = {
      ...base,
      guestMode: true,
      lastSeenAt: new Date('2026-01-01T10:00:00Z').toISOString(),
    };
    const within = Date.parse('2026-01-01T20:00:00Z');
    const beyond = Date.parse('2026-01-01T23:00:00Z');
    expect(isSessionExpired(guest, within)).toBe(false);
    expect(isSessionExpired(guest, beyond)).toBe(true);
  });
});
