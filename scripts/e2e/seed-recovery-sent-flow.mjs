#!/usr/bin/env node
/**
 * Seed BFF recovery flow in Redis for compose E2E (confirm page without new gateway request).
 */
import { randomBytes } from 'node:crypto';
import { loadEnvLocal } from './load-env-local.mjs';
import { normalizeRuPhoneE164 } from './phone-e164.mjs';
import { encryptJson } from './session-crypto.mjs';

const FLOW_PREFIX = 'flow:';

function flowTtlSeconds() {
  const raw = process.env.FLOW_TTL?.trim() || '15m';
  const m = /^(\d+)m$/.exec(raw);
  if (m) return Number.parseInt(m[1], 10) * 60;
  const h = /^(\d+)h$/.exec(raw);
  if (h) return Number.parseInt(h[1], 10) * 3600;
  return 900;
}

/**
 * @param {{ familySlug: string; phoneDigits: string }} args
 * @returns {Promise<{ fid: string }>}
 */
export async function seedRecoverySentFlow(args) {
  loadEnvLocal();
  const encKey = process.env.SESSION_ENC_KEY?.trim();
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!encKey || !redisUrl) {
    throw new Error('seed-recovery-sent-flow: SESSION_ENC_KEY and REDIS_URL required');
  }
  const phoneE164 = normalizeRuPhoneE164(args.phoneDigits);
  if (!phoneE164) {
    throw new Error('seed-recovery-sent-flow: invalid phoneDigits');
  }

  const fid = randomBytes(24).toString('base64url');
  const flow = {
    kind: 'recovery',
    step: 'sent',
    familySlug: args.familySlug,
    phoneE164,
    createdAt: new Date().toISOString(),
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

const isMain = process.argv[1]?.endsWith('seed-recovery-sent-flow.mjs');
if (isMain) {
  const familySlug = process.argv[2];
  const phoneDigits = process.argv[3];
  seedRecoverySentFlow({ familySlug, phoneDigits })
    .then((out) => {
      process.stdout.write(JSON.stringify(out));
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
