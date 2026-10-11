import 'server-only';
import Redis from 'ioredis';
import { getEnv } from '@/env';
import { getLogger } from '@/server/log/logger';

let client: Redis | undefined;
let connectionErrorLogged = false;

function attachRedisErrorHandler(redis: Redis): void {
  redis.on('error', (err: Error) => {
    if (connectionErrorLogged) return;
    connectionErrorLogged = true;
    getLogger().warn({ err: err.message }, 'redis connection error');
  });
}

export function getRedis(): Redis {
  if (!client) {
    const { REDIS_URL } = getEnv();
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2_000)),
    });
    attachRedisErrorHandler(client);
  }
  return client;
}

/** @internal tests */
export function setRedisForTests(mock: Redis): void {
  client = mock;
  connectionErrorLogged = false;
}

export function resetRedisForTests(): void {
  client?.disconnect();
  client = undefined;
  connectionErrorLogged = false;
}
