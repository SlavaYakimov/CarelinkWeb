import 'server-only';
import type { SessionRecord } from '@/server/session/types';
import { pickFamilyIdForBearer } from '@/server/gateway/user-scope';

export type GatewayHeaderContext = {
  session?: SessionRecord;
  familyId?: string;
  traceId: string;
  clientIp: string;
  deviceId?: string;
  accessToken?: string;
  userRefresh?: string;
  userRefreshHeader?: boolean;
  deviceSession?: string;
  deviceSessionHeader?: boolean;
  idempotencyKey?: string;
  /** Family HTTP user routes reject X-User-Refresh when present — Bearer access JWT only. */
  bearerOnlyUserRoute?: boolean;
  userScopedRequest?: boolean;
  extraHeaders?: Record<string, string>;
};

function pickAccessToken(session: SessionRecord, familyId?: string): string | undefined {
  const id = familyId ?? session.activeFamilyId;
  return session.families[id]?.access;
}

/** Build gateway HTTP headers (testable; mirrors gateway client). */
export function buildGatewayRequestHeaders(ctx: GatewayHeaderContext): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Trace-Id': ctx.traceId,
    'X-Forwarded-For': ctx.clientIp,
    'X-Real-IP': ctx.clientIp,
    ...ctx.extraHeaders,
  };

  const bearerFamilyId = ctx.userScopedRequest
    ? ctx.session
      ? pickFamilyIdForBearer(ctx.session, ctx.familyId ?? ctx.session.activeFamilyId)
      : ctx.familyId
    : (ctx.familyId ?? ctx.session?.activeFamilyId);

  if (ctx.accessToken) {
    headers.Authorization = `Bearer ${ctx.accessToken}`;
  } else if (ctx.session && bearerFamilyId) {
    const access = pickAccessToken(ctx.session, bearerFamilyId);
    if (access) headers.Authorization = `Bearer ${access}`;
  }

  const includeUserRefresh =
    !ctx.bearerOnlyUserRoute &&
    Boolean(ctx.userRefresh ?? (ctx.userRefreshHeader ? ctx.session?.userRefresh : undefined));
  if (includeUserRefresh) {
    const userRefresh = ctx.userRefresh ?? ctx.session?.userRefresh;
    if (userRefresh) {
      headers['X-User-Refresh'] = userRefresh;
    }
  }

  const deviceSession =
    ctx.deviceSession ?? (ctx.deviceSessionHeader ? ctx.session?.deviceSession : undefined);
  if (deviceSession) {
    headers['X-Device-Session'] = deviceSession;
  }
  if (ctx.deviceId) headers['X-Device-Id'] = ctx.deviceId;
  if (ctx.idempotencyKey) headers['Idempotency-Key'] = ctx.idempotencyKey;

  return headers;
}
