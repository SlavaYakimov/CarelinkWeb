import 'server-only';
import { getRedis } from '@/server/session/redis';

const LOCK_PREFIX = 'lock:refresh:';

export async function withRefreshLock<T>(
  sid: string,
  familyId: string,
  fn: () => Promise<T>,
  afterWait: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  const key = `${LOCK_PREFIX}${sid}:${familyId}`;
  const token = `${Date.now()}`;
  const acquired = await redis.set(key, token, 'PX', 5000, 'NX');
  if (acquired === 'OK') {
    try {
      return await fn();
    } finally {
      const current = await redis.get(key);
      // Best-effort lock release (not a secret compare).
      if (current && current.length === token.length) {
        await redis.del(key);
      }
    }
  }

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 50));
    const current = await redis.get(key);
    if (!current) {
      return afterWait();
    }
  }
  throw new Error('refresh lock timeout');
}

export function accessNeedsRefresh(expiresAt: string, skewSeconds = 60): boolean {
  const exp = Date.parse(expiresAt);
  if (Number.isNaN(exp)) return true;
  return exp - Date.now() < skewSeconds * 1000;
}

export type RefreshFn = (args: {
  sid: string;
  familyId: string;
  refresh: string;
}) => Promise<import('@/server/session/types').SessionRecord>;
