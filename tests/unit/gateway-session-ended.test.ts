import Redis from 'ioredis-mock';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));
import { resetEnvCacheForTests } from '@/env';
import { GatewayError } from '@/server/gateway/errors';
import { gatewayFetch, setRefreshHandler } from '@/server/gateway/client';
import { encryptJson } from '@/server/session/crypto';
import { SessionEndedError, destroyLocalSession } from '@/server/session/session-ended';
import { resetRedisForTests, setRedisForTests } from '@/server/session/redis';
import type { SessionRecord } from '@/server/session/types';

const encKey = Buffer.alloc(32, 7).toString('base64');

function baseSession(): SessionRecord {
  const past = new Date(Date.now() - 120_000).toISOString();
  return {
    userId: 'user-1',
    defaultFamilyId: 'fam-1',
    activeFamilyId: 'fam-1',
    userRefresh: 'ur',
    deviceSession: 'ds',
    families: {
      'fam-1': {
        access: 'access-old',
        refresh: 'refresh-old',
        expiresAt: past,
      },
    },
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };
}

vi.mock('@/server/session/cookies', () => ({
  clearSessionCookie: vi.fn(async () => undefined),
}));

describe('gateway refresh session ended', () => {
  afterEach(() => {
    resetRedisForTests();
    resetEnvCacheForTests();
    setRefreshHandler(undefined);
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    process.env.APP_ENV = 'development';
    process.env.APP_ORIGIN = 'http://localhost:3000';
    process.env.GATEWAY_URL = 'http://127.0.0.1:8088';
    process.env.REDIS_URL = 'redis://127.0.0.1:6379';
    process.env.SESSION_ENC_KEY = encKey;
    resetEnvCacheForTests();
    setRedisForTests(new Redis());
  });

  it('destroyLocalSession removes Redis session', async () => {
    const redis = new Redis();
    setRedisForTests(redis);
    const record = baseSession();
    const blob = encryptJson(record, encKey);
    await redis.set('sess:sid-1', blob, 'EX', 3600);

    await destroyLocalSession('sid-1', record.userId);

    expect(await redis.get('sess:sid-1')).toBeNull();
  });

  it('refresh 503 does not throw SessionEndedError', async () => {
    const redis = new Redis();
    setRedisForTests(redis);
    const record = baseSession();
    await redis.set('sess:sid-1', encryptJson(record, encKey), 'EX', 3600);

    setRefreshHandler(async () => {
      throw new GatewayError({ code: 'INTERNAL', status: 503 });
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
      headers: new Headers(),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      gatewayFetch(
        { method: 'GET', path: '/v2/ping' },
        { sid: 'sid-1', session: record, clientIp: '127.0.0.1' },
      ),
    ).rejects.toMatchObject({ code: 'INTERNAL', status: 503 });
  });

  it('refresh 401 throws SessionEndedError and clears session', async () => {
    const redis = new Redis();
    setRedisForTests(redis);
    const record = baseSession();
    const blob = encryptJson(record, encKey);
    await redis.set('sess:sid-1', blob, 'EX', 3600);

    setRefreshHandler(async () => {
      await destroyLocalSession('sid-1', record.userId);
      throw new SessionEndedError('sid-1');
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '{}',
        headers: new Headers(),
      }),
    );

    await expect(
      gatewayFetch(
        { method: 'GET', path: '/v2/ping' },
        { sid: 'sid-1', session: record, clientIp: '127.0.0.1' },
      ),
    ).rejects.toThrow('redirect:/session-ended');

    expect(await redis.get('sess:sid-1')).toBeNull();
  });

  it('retries business request once after proactive refresh succeeds', async () => {
    const redis = new Redis();
    setRedisForTests(redis);
    const liveSession: SessionRecord = {
      ...baseSession(),
      families: {
        'fam-1': {
          access: 'access-live',
          refresh: 'refresh-live',
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        },
      },
    };
    await redis.set('sess:sid-1', encryptJson(liveSession, encKey), 'EX', 3600);

    const updated: SessionRecord = {
      ...liveSession,
      families: {
        'fam-1': {
          access: 'access-new',
          refresh: 'refresh-new',
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        },
      },
    };

    setRefreshHandler(async () => updated);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ code: 'TOKEN_EXPIRED' }),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
        headers: new Headers(),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await gatewayFetch<{ ok: true }>(
      { method: 'GET', path: '/v2/resource' },
      {
        sid: 'sid-1',
        session: liveSession,
        clientIp: '127.0.0.1',
      },
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
