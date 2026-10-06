import 'server-only';
import type { components } from '@/server/gateway/types.gen';
import { userIdFromAccessToken } from '@/server/auth/jwt-sub';
import type { SessionRecord } from '@/server/session/types';

type AuthSession = components['schemas']['AuthSessionResponse'];

export function sessionRecordFromAuthResponse(
  session: AuthSession,
  opts: { deviceSession?: string; guestMode?: boolean },
): Omit<SessionRecord, 'createdAt' | 'lastSeenAt'> {
  const families: SessionRecord['families'] = {};
  for (const bundle of session.families) {
    families[bundle.familyId] = {
      access: bundle.access,
      refresh: bundle.refresh,
      expiresAt: new Date(bundle.expiresAt).toISOString(),
    };
  }

  const firstAccess = session.families[0]?.access;
  const userId =
    (firstAccess ? userIdFromAccessToken(firstAccess) : null) ?? session.defaultFamilyId;

  return {
    userId,
    defaultFamilyId: session.defaultFamilyId,
    activeFamilyId: session.defaultFamilyId,
    userRefresh: session.userRefresh,
    families,
    deviceSession: opts.deviceSession ?? '',
    guestMode: opts.guestMode,
  };
}
