import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetEnvCacheForTests } from '@/env';
import { assertRouteHandlerCsrf, CsrfError } from '@/server/security/csrf';

describe('assertRouteHandlerCsrf', () => {
  afterEach(() => resetEnvCacheForTests());

  beforeEach(() => {
    process.env.APP_ENV = 'development';
    process.env.APP_ORIGIN = 'http://localhost:3000';
    process.env.GATEWAY_URL = 'http://127.0.0.1:8088';
    process.env.REDIS_URL = 'redis://127.0.0.1:6379';
    process.env.SESSION_ENC_KEY = Buffer.alloc(32).toString('base64');
    resetEnvCacheForTests();
  });

  it('accepts same origin', () => {
    const h = new Headers({
      origin: 'http://localhost:3000',
      'sec-fetch-site': 'same-origin',
    });
    expect(() => assertRouteHandlerCsrf(h)).not.toThrow();
  });

  it('rejects cross-site', () => {
    const h = new Headers({
      origin: 'https://evil.example',
      'sec-fetch-site': 'cross-site',
    });
    expect(() => assertRouteHandlerCsrf(h)).toThrow(CsrfError);
  });
});
