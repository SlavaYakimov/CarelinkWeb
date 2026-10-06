import 'server-only';
import { gatewayFetch } from '@/server/gateway/client';
import type { components } from '@/server/gateway/types.gen';

const V2_AUTH = '/v2/auth';

type WorkspaceSignInRequest = components['schemas']['WorkspaceSignInRequest'];
type WorkspaceSignInResponse = components['schemas']['WorkspaceSignInResponse'];

export async function workspaceSignIn(
  body: WorkspaceSignInRequest,
  ctx: { clientIp: string; deviceId: string; traceId?: string },
): Promise<WorkspaceSignInResponse> {
  return gatewayFetch<WorkspaceSignInResponse>(
    { method: 'POST', path: `${V2_AUTH}/workspace/sign-in`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}
