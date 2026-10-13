#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { loadEnvLocal } from './load-env-local.mjs';
import { encryptJson } from './session-crypto.mjs';

const FLOW_PREFIX = 'flow:';

function flowTtlSeconds() {
  const raw = process.env.FLOW_TTL?.trim() || '15m';
  const m = /^(\d+)m$/.exec(raw);
  if (m) return Number.parseInt(m[1], 10) * 60;
  return 900;
}

/**
 * @param {Record<string, unknown>} flowPartial
 */
export async function seedJoinFlow(flowPartial) {
  loadEnvLocal();
  const encKey = process.env.SESSION_ENC_KEY?.trim();
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!encKey || !redisUrl) {
    throw new Error('seed-join-flow: SESSION_ENC_KEY and REDIS_URL required');
  }

  const fid = randomBytes(24).toString('base64url');
  const flow = {
    kind: 'join',
    createdAt: new Date().toISOString(),
    ...flowPartial,
  };

  const { default: Redis } = await import('ioredis');
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
  try {
    await redis.connect();
    const blob = encryptJson(flow, encKey);
    await redis.set(`${FLOW_PREFIX}${fid}`, blob, 'EX', flowTtlSeconds());
  } finally {
    redis.disconnect();
  }

  const prefix = process.env.COOKIE_PREFIX ?? '';
  return { fid, flowCookieName: `${prefix}cl_flow` };
}

const isMain = process.argv[1]?.endsWith('seed-join-flow.mjs');
if (isMain) {
  const json = process.argv[2] ?? '{}';
  seedJoinFlow(JSON.parse(json))
    .then((out) => process.stdout.write(JSON.stringify(out)))
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
