import 'server-only';
import { gatewayFetch, type GatewayRequestContext } from '@/server/gateway/client';
import type { components } from '@/server/gateway/types.gen';

type RecoveryRequestBody = components['schemas']['RecoveryRequestBody'];
type RecoveryAcceptedResponse = components['schemas']['RecoveryAcceptedResponse'];
type RecoveryConfirmRequest = components['schemas']['RecoveryConfirmRequest'];
type AuthSessionResponse = components['schemas']['AuthSessionResponse'];

export async function recoveryRequest(
  body: RecoveryRequestBody,
  ctx: Pick<GatewayRequestContext, 'clientIp' | 'deviceId' | 'traceId'>,
): Promise<RecoveryAcceptedResponse> {
  return gatewayFetch<RecoveryAcceptedResponse>(
    { method: 'POST', path: '/v2/auth/recovery/request', body },
    ctx,
  );
}

export async function recoveryConfirm(
  body: RecoveryConfirmRequest,
  ctx: Pick<GatewayRequestContext, 'clientIp' | 'deviceId' | 'traceId'>,
): Promise<AuthSessionResponse> {
  return gatewayFetch<AuthSessionResponse>(
    { method: 'POST', path: '/v2/auth/recovery/confirm', body },
    ctx,
  );
}
