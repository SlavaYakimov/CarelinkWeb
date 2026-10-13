#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { loadEnvLocal } from './load-env-local.mjs';
import { encryptJson } from './session-crypto.mjs';

const SESS_PREFIX = 'sess:';
const familyId = process.env.MOCK_FAMILY_ID ?? '11111111-1111-4111-8111-111111111111';

export async function seedKeeperSession() {
  loadEnvLocal();
  const encKey = process.env.SESSION_ENC_KEY?.trim();
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!encKey || !redisUrl) {
    throw new Error('seed-keeper-session: SESSION_ENC_KEY and REDIS_URL required');
  }

  const sid = randomBytes(32).toString('base64url');
  const session = {
    userId: '22222222-2222-4222-8222-222222222222',
    defaultFamilyId: familyId,
    activeFamilyId: familyId,
    userRefresh: 'keeper-refresh-e2e',
    families: {
      [familyId]: {
        access: 'e2e-access-token',
        refresh: 'e2e-refresh-token',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      },
    },
    deviceSession: 'device-session-e2e',
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };

  const { default: Redis } = await import('ioredis');
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
  try {
    await redis.connect();
    const blob = encryptJson(session, encKey);
    await redis.set(`${SESS_PREFIX}${sid}`, blob, 'EX', 7 * 24 * 3600);
  } finally {
    redis.disconnect();
  }

  const prefix = process.env.COOKIE_PREFIX ?? '';
  return { sid, sessionCookieName: `${prefix}cl_sid`, familyId };
}

if (process.argv[1]?.endsWith('seed-keeper-session.mjs')) {
  seedKeeperSession()
    .then((out) => process.stdout.write(JSON.stringify(out)))
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
