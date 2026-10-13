import 'server-only';
import { gatewayFetch, type GatewayRequestContext } from '@/server/gateway/client';
import type { components } from '@/server/gateway/types.gen';

const V2_AUTH = '/v2/auth';
const V1_AUTH = '/v1/auth';

type GatewayCtx = GatewayRequestContext & {
  clientIp: string;
  deviceId: string;
  traceId?: string;
  userRefresh?: string;
  sid?: string;
  session?: GatewayRequestContext['session'];
};

type SessionCtx = GatewayRequestContext & {
  sid: string;
  session: NonNullable<GatewayRequestContext['session']>;
  familyId: string;
};

type JoinEmailRequestCodeRequest = components['schemas']['JoinEmailRequestCodeRequest'];
type JoinEmailVerifyCodeRequest = components['schemas']['JoinEmailVerifyCodeRequest'];
type JoinEmailVerifyCodeResponse = components['schemas']['JoinEmailVerifyCodeResponse'];
type JoinQrResolveRequest = components['schemas']['JoinQrResolveRequest'];
type JoinQrResolveResponse = components['schemas']['JoinQrResolveResponse'];
type JoinRedeemRequest = components['schemas']['JoinRedeemRequest'];
type JoinRedeemResponse = components['schemas']['JoinRedeemResponse'];
type FamilyJoinLinkResponse = components['schemas']['FamilyJoinLinkResponse'];
type JoinRequestListResponse = components['schemas']['JoinRequestListResponse'];
type CheckFamilySlugResponse = components['schemas']['CheckFamilySlugResponse'];
type PairRejectRequest = components['schemas']['PairRejectRequest'];

export async function joinEmailRequestCode(
  body: JoinEmailRequestCodeRequest,
  ctx: Pick<GatewayCtx, 'clientIp' | 'deviceId' | 'traceId'>,
): Promise<void> {
  await gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/join/email/request-code`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function joinEmailVerifyCode(
  body: JoinEmailVerifyCodeRequest,
  ctx: Pick<GatewayCtx, 'clientIp' | 'deviceId' | 'traceId'>,
): Promise<JoinEmailVerifyCodeResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/join/email/verify-code`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function joinQrResolve(
  body: JoinQrResolveRequest,
  ctx: Pick<GatewayCtx, 'clientIp' | 'deviceId' | 'traceId'>,
): Promise<JoinQrResolveResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/join/qr/resolve`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function joinRedeem(
  body: JoinRedeemRequest,
  ctx: GatewayCtx,
): Promise<JoinRedeemResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/join/redeem`, body },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      userRefresh: ctx.userRefresh,
      sid: ctx.sid,
      session: ctx.session,
      userRefreshHeader: Boolean(ctx.userRefresh),
    },
  );
}

export async function getFamilyJoinLink(ctx: SessionCtx): Promise<FamilyJoinLinkResponse> {
  return gatewayFetch({ method: 'GET', path: `/v1/families/${ctx.familyId}/join-links` }, ctx);
}

export async function createOrRefreshFamilyJoinLink(
  ctx: SessionCtx,
): Promise<FamilyJoinLinkResponse> {
  return gatewayFetch(
    { method: 'POST', path: `/v1/families/${ctx.familyId}/join-links`, body: {} },
    ctx,
  );
}

export async function listFamilyJoinRequests(ctx: SessionCtx): Promise<JoinRequestListResponse> {
  return gatewayFetch(
    { method: 'GET', path: `/v1/families/${ctx.familyId}/join-requests?status=pending` },
    ctx,
  );
}

export async function checkFamilySlug(
  slug: string,
  ctx: Pick<GatewayCtx, 'clientIp' | 'deviceId' | 'traceId' | 'userRefresh'>,
): Promise<CheckFamilySlugResponse> {
  const qs = new URLSearchParams({ slug });
  return gatewayFetch(
    { method: 'GET', path: `/v1/families/check-slug?${qs.toString()}` },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      userRefresh: ctx.userRefresh,
      userRefreshHeader: Boolean(ctx.userRefresh),
    },
  );
}

export async function pairApproveJoinRequest(
  body: PairRejectRequest,
  ctx: SessionCtx,
): Promise<{ status: 'approved' }> {
  return gatewayFetch({ method: 'POST', path: `${V1_AUTH}/pair/approve`, body }, ctx);
}

export async function pairRejectJoinRequest(
  body: PairRejectRequest,
  ctx: SessionCtx,
): Promise<unknown> {
  return gatewayFetch({ method: 'POST', path: `${V1_AUTH}/pair/reject`, body }, ctx);
}
