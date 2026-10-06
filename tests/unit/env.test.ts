import { describe, it, expect, afterEach } from 'vitest';
import { getEnv, resetEnvCacheForTests } from '@/env';

describe('getEnv', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
    resetEnvCacheForTests();
  });

  it('rejects missing APP_ORIGIN', () => {
    delete process.env.APP_ORIGIN;
    process.env.APP_ENV = 'development';
    process.env.GATEWAY_URL = 'http://localhost:8088';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.SESSION_ENC_KEY = Buffer.alloc(32).toString('base64');
    resetEnvCacheForTests();
    expect(() => getEnv()).toThrow(/APP_ORIGIN/);
  });
});
