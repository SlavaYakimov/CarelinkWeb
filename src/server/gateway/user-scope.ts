import 'server-only';
import type { SessionRecord } from '@/server/session/types';

/** Pick a family id that has an access token for Bearer auth on /v1/user/* routes. */
export function pickFamilyIdForBearer(
  session: SessionRecord,
  preferredFamilyId?: string,
): string | undefined {
  const preferred = preferredFamilyId?.trim();
  if (preferred && session.families[preferred]?.access) {
    return preferred;
  }
  if (session.activeFamilyId && session.families[session.activeFamilyId]?.access) {
    return session.activeFamilyId;
  }
  return Object.keys(session.families).find((id) => Boolean(session.families[id]?.access));
}

export function sessionHasUserRefresh(session: SessionRecord): boolean {
  return Boolean(session.userRefresh?.trim());
}
