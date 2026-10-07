#!/usr/bin/env node
/**
 * Reset Redis for compose E2E: BFF session/flow (REDIS_URL) + CarelinkAuth stack (docker compose redis).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { composeRedisFlushArgv } from './carelink-auth-compose.mjs';
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
try {
  await redis.connect();
  await redis.flushall();
} finally {
  redis.disconnect();
}

try {
  await execFileAsync('docker', composeRedisFlushArgv(), { env: process.env });
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(
    'flush-redis: CarelinkAuth compose redis FLUSHALL failed (rate limits may persist):',
    msg,
  );
  process.exit(1);
}
