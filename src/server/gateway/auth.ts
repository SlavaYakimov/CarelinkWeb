import 'server-only';
import { gatewayFetch } from '@/server/gateway/client';
import type { components } from '@/server/gateway/types.gen';

const V2_AUTH = '/v2/auth';
const V1_AUTH = '/v1/auth';

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
type WorkspaceDelegatePushRequest = components['schemas']['WorkspaceDelegatePushRequest'];
type WorkspaceDelegateStatusResponse = components['schemas']['WorkspaceDelegateStatusResponse'];
type WorkspaceDelegateDetailsResponse = components['schemas']['WorkspaceDelegateDetailsResponse'];
type WorkspaceDelegateTokenRequest = components['schemas']['WorkspaceDelegateTokenRequest'];
type WorkspaceDelegateApproveResponse = components['schemas']['WorkspaceDelegateApproveResponse'];
type WorkspaceDelegateRejectResponse = components['schemas']['WorkspaceDelegateRejectResponse'];

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

export async function workspaceSignInRequestDelegatePush(
  body: WorkspaceDelegatePushRequest,
  ctx: GatewayCtx,
): Promise<{ sent?: boolean }> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/workspace/sign-in/request-delegate-push`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function workspaceSignInDelegateStatus(
  query: { challengeId: string; deviceId: string },
  ctx: GatewayCtx,
): Promise<WorkspaceDelegateStatusResponse> {
  const q = new URLSearchParams(query);
  return gatewayFetch(
    { method: 'GET', path: `${V2_AUTH}/workspace/sign-in/delegate-status?${q.toString()}` },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function workspaceSignInDelegateDetails(
  token: string,
  ctx: GatewayCtx,
): Promise<WorkspaceDelegateDetailsResponse> {
  const q = new URLSearchParams({ token });
  return gatewayFetch(
    { method: 'GET', path: `${V2_AUTH}/workspace/sign-in/delegate-details?${q.toString()}` },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function workspaceSignInApproveDelegate(
  body: WorkspaceDelegateTokenRequest,
  ctx: GatewayCtx & { accessToken: string },
): Promise<WorkspaceDelegateApproveResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/workspace/sign-in/approve-delegate`, body },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      accessToken: ctx.accessToken,
    },
  );
}

export async function workspaceSignInRejectDelegate(
  body: WorkspaceDelegateTokenRequest,
  ctx: GatewayCtx & { accessToken: string },
): Promise<WorkspaceDelegateRejectResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/workspace/sign-in/reject-delegate`, body },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      accessToken: ctx.accessToken,
    },
  );
}

export async function authLogout(
  body: { refresh: string; allDevices?: boolean },
  ctx: GatewayCtx & { accessToken: string },
): Promise<{ ok: true }> {
  return gatewayFetch(
    {
      method: 'POST',
      path: `${V1_AUTH}/logout`,
      body: { refresh: body.refresh, allDevices: body.allDevices ?? false },
    },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      accessToken: ctx.accessToken,
    },
  );
}
