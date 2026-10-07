import 'server-only';

import { gatewayFetch } from '@/server/gateway/client';

type GatewayCtx = {
  clientIp: string;
  deviceId: string;
  traceId?: string;
  accessToken: string;
};

/** Gateway proxy expects snake_case (CarelinkAuth device_register_proxy.go); user_id is filled from JWT. */
type DeviceRegisterGatewayBody = {
  platform: 'ios' | 'android';
  device_id: string;
  token: string;
};

/** POST /v1/devices/register — Bearer device_registration JWT from onboarding phone verify. */
export async function gatewayRegisterDevice(
  body: DeviceRegisterGatewayBody,
  ctx: GatewayCtx,
): Promise<{ deviceId?: string }> {
  return gatewayFetch(
    { method: 'POST', path: '/v1/devices/register', body },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      accessToken: ctx.accessToken,
    },
  );
}
