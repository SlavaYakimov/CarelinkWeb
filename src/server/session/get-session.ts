import 'server-only';
import { readSessionCookie } from '@/server/session/cookies';
import { deleteSession, loadSession, newSessionId, saveSession } from '@/server/session/store';
import { isSessionExpired } from '@/server/session/policy';
import { taintSessionSecrets } from '@/server/session/taint';
import type { SessionRecord } from '@/server/session/types';

export type SessionContext = {
  sid: string;
  session: SessionRecord;
};

/**
 * Loads the current browser session from Redis (via httpOnly cookie).
 * Returns null if missing or expired.
 */
export async function getSession(): Promise<SessionContext | null> {
  const sid = await readSessionCookie();
  if (!sid) return null;

  const loaded = await loadSession(sid);
  if (!loaded) return null;

  const now = Date.now();
  if (isSessionExpired(loaded.record, now)) {
    await deleteSession(sid, loaded.record.userId);
    return null;
  }

  const session: SessionRecord = {
    ...loaded.record,
    lastSeenAt: new Date(now).toISOString(),
  };

  await saveSession(sid, session);

  taintSessionSecrets(session);
  return { sid, session };
}

/** Creates a fresh session id on successful login (session fixation protection). */
export async function bindNewSession(
  record: Omit<SessionRecord, 'createdAt' | 'lastSeenAt'>,
  opts: { guestMode?: boolean } = {},
): Promise<{ sid: string; session: SessionRecord }> {
  const now = new Date().toISOString();
  const session: SessionRecord = {
    ...record,
    guestMode: opts.guestMode,
    createdAt: now,
    lastSeenAt: now,
  };
  const sid = newSessionId();
  await saveSession(sid, session);
  taintSessionSecrets(session);
  return { sid, session };
}
