#!/usr/bin/env node
/**
 * Reset Redis for E2E: BFF session/flow (REDIS_URL) + optional CarelinkAuth compose redis.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { composeRedisFlushArgv, isCarelinkAuthComposeAvailable } from './carelink-auth-compose.mjs';
import { loadEnvLocal } from './load-env-local.mjs';

const execFileAsync = promisify(execFile);

loadEnvLocal();

const url = process.env.REDIS_URL?.trim();
if (!url) {
  console.error('flush-redis: REDIS_URL is not set');
  process.exit(1);
}

const { default: Redis } = await import('ioredis');
const redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
redis.on('error', () => {
  /* flush client is short-lived; avoid unhandled error events */
});
try {
  await redis.connect();
  await redis.flushall();
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error('flush-redis: REDIS_URL flush failed:', msg);
  process.exit(1);
} finally {
  redis.disconnect();
}

const composeRequired = process.env.CYPRESS_E2E_COMPOSE === '1';

if (!isCarelinkAuthComposeAvailable()) {
  if (composeRequired) {
    console.error(
      'flush-redis: CYPRESS_E2E_COMPOSE=1 but CarelinkAuth compose not found (set E2E_CARELINK_AUTH_ROOT)',
    );
    process.exit(1);
  }
  process.exit(0);
}

try {
  await execFileAsync('docker', composeRedisFlushArgv(), { env: process.env });
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  if (composeRequired) {
    console.error('flush-redis: CarelinkAuth compose redis FLUSHALL failed:', msg);
    process.exit(1);
  }
  console.warn(
    'flush-redis: compose redis flush skipped (rate limits on auth stack may persist):',
    msg,
  );
}
