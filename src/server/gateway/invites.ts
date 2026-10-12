import 'server-only';
import { randomUUID } from 'node:crypto';
import { getEnv } from '@/env';
import { gatewayFetch, type GatewayRequestContext } from '@/server/gateway/client';
import { GatewayError, normalizeGatewayError } from '@/server/gateway/errors';
import type { components } from '@/server/gateway/types.gen';

type SessionCtx = GatewayRequestContext & {
  sid: string;
  session: NonNullable<GatewayRequestContext['session']>;
  familyId: string;
};

type UserSessionCtx = GatewayRequestContext & {
  sid: string;
  session: NonNullable<GatewayRequestContext['session']>;
};

type LookupBody = components['schemas']['MemberInviteLookupEmailRequest'];
type LookupResponse = components['schemas']['MemberInviteLookupEmailResponse'];
type CreateBody = components['schemas']['CreateMemberInviteRequest'];
type CreateResponse = components['schemas']['CreateMemberInviteResponse'];
type ListResponse = components['schemas']['MemberInviteListResponse'];
type RoleListResponse = components['schemas']['RoleTemplateListResponse'];
type PendingListResponse = components['schemas']['PendingMemberInviteListResponse'];
type AcceptResponse = components['schemas']['MemberInviteAcceptResponse'];
type DeclineResponse = components['schemas']['MemberInviteDeclineResponse'];
type ResendResponse = components['schemas']['MemberInviteResendResponse'];
type RevokeResponse = components['schemas']['MemberInviteRevokeResponse'];
type AvatarResponse = components['schemas']['MemberInviteAvatarResponse'];
type AuthSessionResponse = components['schemas']['AuthSessionResponse'];

function familyPath(familyId: string, suffix: string): string {
  return `/v1/families/${familyId}${suffix}`;
}

export async function listFamilyRoleTemplates(ctx: SessionCtx): Promise<RoleListResponse> {
  return gatewayFetch<RoleListResponse>(
    { method: 'GET', path: familyPath(ctx.familyId, '/role-templates') },
    ctx,
  );
}

export async function lookupMemberInviteEmail(
  body: LookupBody,
  ctx: SessionCtx,
): Promise<LookupResponse> {
  return gatewayFetch<LookupResponse>(
    { method: 'POST', path: familyPath(ctx.familyId, '/member-invites/lookup-email'), body },
    ctx,
  );
}

export async function createMemberInvite(
  body: CreateBody,
  ctx: SessionCtx & { idempotencyKey?: string },
): Promise<CreateResponse> {
  return gatewayFetch<CreateResponse>(
    { method: 'POST', path: familyPath(ctx.familyId, '/member-invites'), body },
    ctx,
  );
}

export async function listFamilyMemberInvites(ctx: SessionCtx): Promise<ListResponse> {
  return gatewayFetch<ListResponse>(
    { method: 'GET', path: familyPath(ctx.familyId, '/member-invites') },
    ctx,
  );
}

export async function resendMemberInvite(
  inviteId: string,
  ctx: SessionCtx,
): Promise<ResendResponse> {
  return gatewayFetch<ResendResponse>(
    {
      method: 'POST',
      path: familyPath(ctx.familyId, `/member-invites/${inviteId}/resend`),
      body: {},
    },
    ctx,
  );
}

export async function revokeMemberInvite(
  inviteId: string,
  ctx: SessionCtx,
): Promise<RevokeResponse> {
  return gatewayFetch<RevokeResponse>(
    {
      method: 'POST',
      path: familyPath(ctx.familyId, `/member-invites/${inviteId}/revoke`),
      body: {},
    },
    ctx,
  );
}

export async function listPendingMemberInvites(ctx: UserSessionCtx): Promise<PendingListResponse> {
  return gatewayFetch<PendingListResponse>(
    { method: 'GET', path: '/v1/user/member-invites/pending' },
    {
      ...ctx,
      userScopedRequest: true,
      bearerOnlyUserRoute: true,
    },
  );
}

export async function acceptMemberInvite(
  inviteId: string,
  ctx: UserSessionCtx,
): Promise<AcceptResponse> {
  return gatewayFetch<AcceptResponse>(
    { method: 'POST', path: `/v1/user/member-invites/${inviteId}/accept`, body: {} },
    {
      ...ctx,
      userScopedRequest: true,
      bearerOnlyUserRoute: true,
    },
  );
}

export async function declineMemberInvite(
  inviteId: string,
  ctx: UserSessionCtx,
): Promise<DeclineResponse> {
  return gatewayFetch<DeclineResponse>(
    { method: 'POST', path: `/v1/user/member-invites/${inviteId}/decline`, body: {} },
    {
      ...ctx,
      userScopedRequest: true,
      bearerOnlyUserRoute: true,
    },
  );
}

export async function rebuildAuthSession(ctx: UserSessionCtx): Promise<AuthSessionResponse> {
  return gatewayFetch<AuthSessionResponse>(
    { method: 'POST', path: '/v1/auth/session/rebuild', body: {} },
    {
      ...ctx,
      userScopedRequest: true,
      userRefreshHeader: true,
    },
  );
}

/** Multipart avatar upload (family HTTP fallback). */
export async function uploadMemberInviteAvatar(
  file: File,
  ctx: SessionCtx,
): Promise<AvatarResponse> {
  const env = getEnv();
  const traceId = randomUUID();
  const url = `${env.GATEWAY_URL.replace(/\/$/, '')}${familyPath(ctx.familyId, '/member-invites/avatar')}`;
  const access = ctx.session.families[ctx.familyId]?.access;
  if (!access) {
    throw new GatewayError({ code: 'UNAUTHORIZED', status: 401, traceId });
  }

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${access}`,
      'X-Trace-Id': traceId,
      'X-Forwarded-For': ctx.clientIp,
      'X-Real-IP': ctx.clientIp,
      ...(ctx.deviceId ? { 'X-Device-Id': ctx.deviceId } : {}),
    },
    body: form,
    signal: AbortSignal.timeout(env.GATEWAY_TIMEOUT_MS),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }

  if (!res.ok) {
    throw normalizeGatewayError(res.status, json, res.headers, traceId);
  }

  return json as AvatarResponse;
}
