import 'server-only';
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { cookieName, getEnv } from '@/env';
import { parseDurationToSeconds } from '@/server/session/duration';

const DEVICE_COOKIE_MAX_AGE = 400 * 24 * 3600;

export type CookieWriteOptions = {
  guestMode?: boolean;
};

/** Q6: trusted device — cookie max-age matches idle TTL; guest — session cookie (12h in Redis). */
export async function setSessionCookie(sid: string, opts: CookieWriteOptions = {}): Promise<void> {
  const env = getEnv();
  const store = await cookies();
  const name = cookieName('cl_sid');
  const secure = env.COOKIE_SECURE;
  const guest = opts.guestMode ?? false;
  const maxAge = guest ? undefined : parseDurationToSeconds(env.SESSION_IDLE_TTL);

  store.set(name, sid, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    ...(maxAge !== undefined ? { maxAge } : {}),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(cookieName('cl_sid'));
}

export async function readSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(cookieName('cl_sid'))?.value;
}

export async function setFlowCookie(fid: string): Promise<void> {
  const env = getEnv();
  const store = await cookies();
  store.set(cookieName('cl_flow'), fid, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: parseDurationToSeconds(env.FLOW_TTL),
  });
}

export async function readFlowCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(cookieName('cl_flow'))?.value;
}

export async function clearFlowCookie(): Promise<void> {
  const store = await cookies();
  store.delete(cookieName('cl_flow'));
}

export async function ensureDeviceCookie(): Promise<string> {
  const env = getEnv();
  const store = await cookies();
  const name = cookieName('cl_did');
  const existing = store.get(name)?.value;
  if (existing) return existing;
  const id = randomUUID();
  store.set(name, id, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
  return id;
}
