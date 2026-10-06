import Redis from 'ioredis-mock';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetEnvCacheForTests } from '@/env';
import { withRefreshLock } from '@/server/gateway/refresh';
import { resetRedisForTests, setRedisForTests } from '@/server/session/redis';

describe('withRefreshLock', () => {
  afterEach(() => {
    resetRedisForTests();
    resetEnvCacheForTests();
  });

  beforeEach(() => {
    process.env.APP_ENV = 'development';
    process.env.APP_ORIGIN = 'http://localhost:3000';
    process.env.GATEWAY_URL = 'http://127.0.0.1:8088';
    process.env.REDIS_URL = 'redis://127.0.0.1:6379';
    process.env.SESSION_ENC_KEY = Buffer.alloc(32).toString('base64');
    resetEnvCacheForTests();
    setRedisForTests(new Redis());
  });

  it('runs refresh exactly once for 5 parallel waiters', async () => {
    let refreshCalls = 0;
    const refresh = async () => {
      refreshCalls += 1;
      await new Promise((r) => setTimeout(r, 100));
      return 'ok';
    };

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        withRefreshLock('sid1', 'fam1', refresh, async () => 'waited' as const),
      ),
    );

    expect(refreshCalls).toBe(1);
    expect(results.filter((r) => r === 'ok').length).toBe(1);
    expect(results.filter((r) => r === 'waited').length).toBe(4);
  });
});
