import 'server-only';
import { headers } from 'next/headers';
import { ensureDeviceCookie, readDeviceCookie } from '@/server/session/cookies';
import { resolveClientIp } from '@/server/security/client-ip';

async function clientIpFromHeaders(): Promise<string> {
  const h = await headers();
  return resolveClientIp({
    forwardedFor: h.get('x-forwarded-for'),
    realIp: h.get('x-real-ip'),
  });
}

/** Server Actions / Route Handlers — may mint `cl_did` when missing. */
export async function gatewayActionContext(): Promise<{ clientIp: string; deviceId: string }> {
  const clientIp = await clientIpFromHeaders();
  const deviceId = await ensureDeviceCookie();
  return { clientIp, deviceId };
}

/** RSC / data loaders — read-only; never sets cookies during render. */
export async function gatewayDataContext(): Promise<{ clientIp: string; deviceId: string }> {
  const clientIp = await clientIpFromHeaders();
  const deviceId = (await readDeviceCookie()) ?? 'web';
  return { clientIp, deviceId };
}
