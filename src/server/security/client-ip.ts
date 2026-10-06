import 'server-only';
import { getEnv } from '@/env';

/**
 * Client IP for gateway X-Forwarded-For (§1.5).
 * Uses the rightmost untrusted hop model with TRUSTED_PROXY_HOPS.
 */
export function clientIpFromForwarded(forwardedFor: string | null, hops: number): string | null {
  if (!forwardedFor) return null;
  const parts = forwardedFor
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const idx = Math.max(0, parts.length - hops - 1);
  return parts[idx] ?? parts[0] ?? null;
}

export function resolveClientIp(params: {
  forwardedFor: string | null;
  realIp: string | null;
  remoteAddr?: string | null;
}): string {
  const hops = getEnv().TRUSTED_PROXY_HOPS;
  const fromXff = clientIpFromForwarded(params.forwardedFor, hops);
  if (fromXff) return fromXff;
  if (params.realIp) return params.realIp;
  if (params.remoteAddr) return params.remoteAddr.replace(/^::ffff:/, '');
  return '127.0.0.1';
}
