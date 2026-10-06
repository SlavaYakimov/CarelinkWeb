import { describe, it, expect } from 'vitest';
import { normalizeGatewayError } from '@/server/gateway/errors';

describe('normalizeGatewayError', () => {
  it('maps auth REST codes', () => {
    const err = normalizeGatewayError(
      401,
      { code: 'INVALID_CREDENTIALS', message: 'nope' },
      new Headers(),
      'trace-1',
    );
    expect(err.code).toBe('INVALID_CREDENTIALS');
    expect(err.status).toBe(401);
    expect(err.traceId).toBe('trace-1');
  });

  it('maps grpc numeric codes', () => {
    const err = normalizeGatewayError(500, { code: 7, message: 'denied' }, new Headers(), 't');
    expect(err.code).toBe('FORBIDDEN');
    expect(err.status).toBe(403);
  });

  it('reads Retry-After', () => {
    const headers = new Headers({ 'retry-after': '120' });
    const err = normalizeGatewayError(429, { code: 'RATE_LIMIT' }, headers, 't');
    expect(err.retryAfter).toBe(120);
  });
});
