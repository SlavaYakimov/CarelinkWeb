import 'server-only';
import { NextResponse } from 'next/server';
import { SESSION_ENDED_CODE, type SessionEndedJson } from '@/lib/session-ended';
import {
  SessionEndedError,
  destroyLocalSession,
  redirectSessionEnded,
} from '@/server/session/session-ended';

export { SESSION_ENDED_CODE };
export type { SessionEndedJson };

export function sessionEndedJsonResponse(): NextResponse<SessionEndedJson> {
  return NextResponse.json({ code: SESSION_ENDED_CODE }, { status: 401 });
}

async function teardownSessionEnded(err: SessionEndedError): Promise<void> {
  await destroyLocalSession(err.sid);
}

/** Server Actions and RSC: clear session and redirect to screen 40. */
export async function handleSessionEndedForAction(err: unknown): Promise<never> {
  if (err instanceof SessionEndedError) {
    await redirectSessionEnded(err.sid);
  }
  throw err;
}

/** Route handlers (fetch): clear session and return JSON 401. */
export async function handleSessionEndedForRoute(err: unknown): Promise<NextResponse> {
  if (err instanceof SessionEndedError) {
    await teardownSessionEnded(err);
    return sessionEndedJsonResponse();
  }
  throw err;
}

type ServerActionFn = (...args: never[]) => Promise<unknown>;

/** Wraps a Server Action that may call gateway with an active session. */
export function withServerAction<T extends ServerActionFn>(fn: T): T {
  const wrapped = async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return (await fn(...args)) as Awaited<ReturnType<T>>;
    } catch (err) {
      return handleSessionEndedForAction(err);
    }
  };
  return wrapped as T;
}

/** Wraps non-action server tasks (e.g. loaders called from RSC). */
export function withSessionTask<T extends ServerActionFn>(fn: T): T {
  return withServerAction(fn);
}

type RouteHandler = (request: Request) => Promise<Response>;

/** Wraps App Router route handlers under `/api/*`. */
export function withRouteHandler(handler: RouteHandler): RouteHandler {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (err) {
      if (err instanceof SessionEndedError) {
        return handleSessionEndedForRoute(err);
      }
      throw err;
    }
  };
}
