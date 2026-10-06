import { NextResponse } from 'next/server';
import { getEnv } from '@/env';
import { getRedis } from '@/server/session/redis';

export const runtime = 'nodejs';

type Check = { ok: boolean; detail?: string };

async function checkRedis(): Promise<Check> {
  try {
    const pong = await getRedis().ping();
    return { ok: pong === 'PONG' };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'redis error' };
  }
}

async function checkGateway(): Promise<Check> {
  const { GATEWAY_URL, GATEWAY_TIMEOUT_MS } = getEnv();
  const url = `${GATEWAY_URL.replace(/\/$/, '')}/healthz`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(Math.min(GATEWAY_TIMEOUT_MS, 5000)),
    });
    return { ok: res.ok };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'gateway error' };
  }
}

export async function GET() {
  const [redis, gateway] = await Promise.all([checkRedis(), checkGateway()]);
  const ok = redis.ok && gateway.ok;
  return NextResponse.json(
    {
      status: ok ? 'ok' : 'degraded',
      checks: { redis, gateway },
    },
    { status: ok ? 200 : 503 },
  );
}
