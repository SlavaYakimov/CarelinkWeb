import 'server-only';
import { headers } from 'next/headers';
import { ensureDeviceCookie } from '@/server/session/cookies';
import { resolveClientIp } from '@/server/security/client-ip';

export async function gatewayActionContext(): Promise<{ clientIp: string; deviceId: string }> {
  const h = await headers();
  const clientIp = resolveClientIp({
    forwardedFor: h.get('x-forwarded-for'),
    realIp: h.get('x-real-ip'),
  });
  const deviceId = await ensureDeviceCookie();
  return { clientIp, deviceId };
}
