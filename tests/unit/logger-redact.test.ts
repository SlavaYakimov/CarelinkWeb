import { describe, it, expect } from 'vitest';
import { Writable } from 'node:stream';
import pino from 'pino';

describe('pino redact paths (§4.10)', () => {
  it('censors password and phone fields', async () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk, _enc, cb) {
        lines.push(chunk.toString());
        cb();
      },
    });

    const log = pino(
      {
        level: 'info',
        redact: {
          paths: ['password', 'phone', 'req.headers.authorization'],
          censor: '[Redacted]',
        },
      },
      stream,
    );

    log.info({ password: 'secret', phone: '+79990000000' });
    await new Promise((r) => setTimeout(r, 20));
    const out = lines.join('');
    expect(out).not.toContain('secret');
    expect(out).not.toContain('+79990000000');
    expect(out).toContain('[Redacted]');
  });
});
