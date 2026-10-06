import 'server-only';
import { randomUUID } from 'node:crypto';
import { getEnv } from '@/env';
import { rethrowOrRedirectSessionEnded } from '@/server/gateway/handle-session-ended';
import { GatewayError, normalizeGatewayError } from '@/server/gateway/errors';
import { accessNeedsRefresh, withRefreshLock, type RefreshFn } from '@/server/gateway/refresh';
import { getLogger } from '@/server/log/logger';
import {
  destroyLocalSession,
  isRefreshRejection,
  SessionEndedError,
} from '@/server/session/session-ended';
import { loadSession, saveSession } from '@/server/session/store';
import type { SessionRecord } from '@/server/session/types';

export type GatewayRequestContext = {
  sid?: string;
  session?: SessionRecord;
  familyId?: string;
  clientIp: string;
  deviceId?: string;
  traceId?: string;
  idempotencyKey?: string;
  userRefreshHeader?: boolean;
  deviceSessionHeader?: boolean;
  /** Pre-session device verify (sign-in complete before Redis session exists). */
  deviceSession?: string;
  /** Bearer token when no Redis session is loaded (e.g. logout). */
  accessToken?: string;
};

export type GatewayRequestInit = {
  method?: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

let refreshImpl: RefreshFn | undefined;

/** Injectable refresh for tests. Production uses POST /v1/auth/token/refresh. */
export function setRefreshHandler(fn: RefreshFn | undefined): void {
  refreshImpl = fn;
}

function joinUrl(base: string, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${p}`;
}

function pickAccessToken(session: SessionRecord, familyId?: string): string | undefined {
  const id = familyId ?? session.activeFamilyId;
  return session.families[id]?.access;
}

async function defaultRefresh(args: {
  sid: string;
  familyId: string;
  refresh: string;
  session: SessionRecord;
}): Promise<SessionRecord> {
  const env = getEnv();
  const traceId = randomUUID();
  const url = joinUrl(env.GATEWAY_URL, '/v1/auth/token/refresh');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Scope': `family:${args.familyId}`,
      'X-Trace-Id': traceId,
    },
    body: JSON.stringify({ refresh: args.refresh }),
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
    const err = normalizeGatewayError(res.status, json, res.headers, traceId);
    if (isRefreshRejection(res.status)) {
      await destroyLocalSession(args.sid, args.session.userId);
      throw new SessionEndedError(args.sid);
    }
    throw err;
  }
  const payload = json as {
    familyId: string;
    access: string;
    refresh: string;
    expiresAt: string;
  };
  const session: SessionRecord = {
    ...args.session,
    families: {
      ...args.session.families,
      [payload.familyId]: {
        access: payload.access,
        refresh: payload.refresh,
        expiresAt: payload.expiresAt,
      },
    },
  };
  await saveSession(args.sid, session);
  return session;
}

async function refreshFamilyTokens(
  sid: string,
  familyId: string,
  session: SessionRecord,
): Promise<SessionRecord> {
  const tokens = session.families[familyId];
  if (!tokens) return session;

  const refreshFn =
    refreshImpl ??
    (async (a) =>
      defaultRefresh({
        sid: a.sid,
        familyId: a.familyId,
        refresh: a.refresh,
        session,
      }));

  return withRefreshLock(
    sid,
    familyId,
    async () => {
      const latest = await loadSession(sid);
      if (!latest) {
        throw new SessionEndedError(sid);
      }
      const currentSession = latest.record;
      const current = currentSession.families[familyId];
      if (!current) return currentSession;
      if (!accessNeedsRefresh(current.expiresAt)) return currentSession;
      return refreshFn({
        sid,
        familyId,
        refresh: current.refresh,
      });
    },
    async () => {
      const latest = await loadSession(sid);
      if (!latest) {
        throw new SessionEndedError(sid);
      }
      return latest.record;
    },
  );
}

export async function gatewayFetch<T = unknown>(
  init: GatewayRequestInit,
  ctx: GatewayRequestContext,
): Promise<T> {
  try {
    return await gatewayFetchInner<T>(init, ctx);
  } catch (err) {
    rethrowOrRedirectSessionEnded(err);
  }
}

async function gatewayFetchInner<T = unknown>(
  init: GatewayRequestInit,
  ctx: GatewayRequestContext,
): Promise<T> {
  const env = getEnv();
  const log = getLogger();
  const traceId = ctx.traceId ?? randomUUID();
  let session = ctx.session;

  if (ctx.sid && session) {
    session = await refreshFamilyTokens(ctx.sid, ctx.familyId ?? session.activeFamilyId, session);
  }

  const familyId = ctx.familyId ?? session?.activeFamilyId;
  const url = joinUrl(env.GATEWAY_URL, init.path);
  const method = init.method ?? 'GET';

  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Trace-Id': traceId,
      'X-Forwarded-For': ctx.clientIp,
      'X-Real-IP': ctx.clientIp,
      ...init.headers,
    };
    if (ctx.accessToken) {
      headers.Authorization = `Bearer ${ctx.accessToken}`;
    } else if (session && familyId) {
      const access = pickAccessToken(session, familyId);
      if (access) headers.Authorization = `Bearer ${access}`;
    }
    if (ctx.userRefreshHeader && session?.userRefresh) {
      headers['X-User-Refresh'] = session.userRefresh;
    }
    const deviceSession =
      ctx.deviceSession ?? (ctx.deviceSessionHeader ? session?.deviceSession : undefined);
    if (deviceSession) {
      headers['X-Device-Session'] = deviceSession;
    }
    if (ctx.deviceId) headers['X-Device-Id'] = ctx.deviceId;
    if (ctx.idempotencyKey) headers['Idempotency-Key'] = ctx.idempotencyKey;
    return headers;
  };

  const doFetch = async () =>
    fetch(url, {
      method,
      headers: buildHeaders(),
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(env.GATEWAY_TIMEOUT_MS),
    });

  let res = await doFetch();

  if (res.status === 401 && ctx.sid && session && familyId && session.families[familyId]) {
    const errBody = await res.text();
    let errJson: unknown = {};
    try {
      errJson = errBody ? JSON.parse(errBody) : {};
    } catch {
      errJson = {};
    }
    const err = normalizeGatewayError(res.status, errJson, res.headers, traceId);
    if (err.code === 'TOKEN_EXPIRED' || err.code === 'UNAUTHORIZED') {
      try {
        session = await refreshFamilyTokens(ctx.sid, familyId, session);
      } catch (refreshErr) {
        if (refreshErr instanceof SessionEndedError) throw refreshErr;
        throw refreshErr;
      }
      res = await doFetch();
    }
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { parseError: true };
  }

  const codeField = (json as { code?: unknown }).code;
  log.info(
    {
      traceId,
      method,
      path: init.path.replace(/\?.*$/, ''),
      status: res.status,
      code: typeof codeField === 'string' ? codeField : undefined,
    },
    'gateway',
  );

  if (!res.ok) {
    throw normalizeGatewayError(res.status, json, res.headers, traceId);
  }

  return json as T;
}

export { GatewayError, SessionEndedError };
