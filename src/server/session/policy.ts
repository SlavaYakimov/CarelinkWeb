import { getEnv } from '@/env';
import { parseDurationToMs } from '@/server/session/duration';
import type { SessionRecord } from '@/server/session/types';

export function isSessionExpired(record: SessionRecord, now: number): boolean {
  const env = getEnv();
  const createdAt = Date.parse(record.createdAt);
  const lastSeenAt = Date.parse(record.lastSeenAt);
  const absoluteMs = parseDurationToMs(env.SESSION_ABSOLUTE_TTL);
  if (now - createdAt > absoluteMs) return true;

  const idleMs = record.guestMode
    ? parseDurationToMs(env.SESSION_GUEST_TTL)
    : parseDurationToMs(env.SESSION_IDLE_TTL);
  return now - lastSeenAt > idleMs;
}
