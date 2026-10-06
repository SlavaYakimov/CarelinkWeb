import 'server-only';
import { redirect } from 'next/navigation';
import { clearSessionCookie } from '@/server/session/cookies';
import { deleteSession, loadSession } from '@/server/session/store';

/** Refresh token rejected (401) — local session must be torn down and user sent to screen 40. */
export class SessionEndedError extends Error {
  readonly name = 'SessionEndedError';

  constructor(public readonly sid: string) {
    super('SESSION_ENDED');
  }
}

export async function destroyLocalSession(sid: string, userId?: string): Promise<void> {
  let uid = userId;
  if (!uid) {
    const loaded = await loadSession(sid);
    uid = loaded?.record.userId;
  }
  await deleteSession(sid, uid);
  await clearSessionCookie();
}

/** Idempotent: clears Redis + cookie, then redirects (never returns). */
export async function redirectSessionEnded(sid: string, userId?: string): Promise<never> {
  await destroyLocalSession(sid, userId);
  redirect('/session-ended');
}

export function isRefreshRejection(status: number): boolean {
  return status === 401;
}
