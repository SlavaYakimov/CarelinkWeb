import 'server-only';
import Redis from 'ioredis';
import { getEnv } from '@/env';

let client: Redis | undefined;

export function getRedis(): Redis {
  if (!client) {
    const { REDIS_URL } = getEnv();
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  }
  return client;
}

/** @internal tests */
export function setRedisForTests(mock: Redis): void {
  client = mock;
}

export function resetRedisForTests(): void {
  client = undefined;
}
