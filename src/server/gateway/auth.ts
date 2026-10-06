import 'server-only';
import { gatewayFetch } from '@/server/gateway/client';
import type { components } from '@/server/gateway/types.gen';

const V2_AUTH = '/v2/auth';

type GatewayCtx = { clientIp: string; deviceId: string; traceId?: string; deviceSession?: string };

type WorkspaceSignInRequest = components['schemas']['WorkspaceSignInRequest'];
type WorkspaceSignInResponse = components['schemas']['WorkspaceSignInResponse'];
type DeviceVerifySmsRequest = components['schemas']['DeviceVerifySmsRequest'];
type DeviceVerifySmsConfirmRequest = components['schemas']['DeviceVerifySmsConfirmRequest'];
type DeviceVerifySessionResponse = components['schemas']['DeviceVerifySessionResponse'];
type WorkspaceSignInCompleteRequest = components['schemas']['WorkspaceSignInCompleteRequest'];
type WorkspaceSignInCompleteResponse = components['schemas']['WorkspaceSignInCompleteResponse'];
type WorkspaceChangePasswordRequest = components['schemas']['WorkspaceChangePasswordRequest'];
type AuthSessionResponse = components['schemas']['AuthSessionResponse'];

export async function workspaceSignIn(
  body: WorkspaceSignInRequest,
  ctx: GatewayCtx,
): Promise<WorkspaceSignInResponse> {
  return gatewayFetch<WorkspaceSignInResponse>(
    { method: 'POST', path: `${V2_AUTH}/workspace/sign-in`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function workspaceSignInRequestSms(
  body: DeviceVerifySmsRequest,
  ctx: GatewayCtx,
): Promise<{ sent?: boolean }> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/workspace/sign-in/request-sms`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function workspaceSignInVerifySms(
  body: DeviceVerifySmsConfirmRequest,
  ctx: GatewayCtx,
): Promise<DeviceVerifySessionResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/workspace/sign-in/verify-sms`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function workspaceSignInComplete(
  body: WorkspaceSignInCompleteRequest,
  ctx: GatewayCtx,
): Promise<WorkspaceSignInCompleteResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/workspace/sign-in/complete`, body },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      deviceSession: ctx.deviceSession,
    },
  );
}

export async function workspaceChangePassword(
  body: WorkspaceChangePasswordRequest,
  ctx: GatewayCtx,
): Promise<AuthSessionResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/workspace/password/change`, body },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      deviceSession: ctx.deviceSession,
    },
  );
}
