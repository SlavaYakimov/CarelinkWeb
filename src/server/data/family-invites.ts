import 'server-only';
import { redirect } from 'next/navigation';
import { gatewayActionContext } from '@/server/actions/request-context';
import {
  normalizeFamilyMemberInviteList,
  type MemberInviteView,
} from '@/lib/invites/normalize-family-invite';
import { listFamilyMemberInvites, listFamilyRoleTemplates } from '@/server/gateway/invites';
import { GatewayError } from '@/server/gateway/errors';
import { getLogger } from '@/server/log/logger';
import { getSession } from '@/server/session/get-session';
import type { components } from '@/server/gateway/types.gen';

export type { MemberInviteView };
export type RoleTemplate = components['schemas']['RoleTemplate'];

export async function fetchFamilyInvites(familyId: string): Promise<MemberInviteView[] | null> {
  const sessionCtx = await getSession();
  if (!sessionCtx) return null;
  if (!sessionCtx.session.families[familyId]) return null;
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const res = await listFamilyMemberInvites({
      sid: sessionCtx.sid,
      session: sessionCtx.session,
      clientIp,
      deviceId,
      familyId,
    });
    const log = getLogger();
    return normalizeFamilyMemberInviteList(res, {
      onDropped: (reason) => {
        log.warn({ reason }, 'family member invite row dropped during normalize');
      },
    });
  } catch (err) {
    if (err instanceof GatewayError && err.code === 'FORBIDDEN') {
      redirect('/forbidden');
    }
    return null;
  }
}

export async function fetchFamilyRoleTemplates(familyId: string): Promise<RoleTemplate[] | null> {
  const sessionCtx = await getSession();
  if (!sessionCtx) return null;
  if (!sessionCtx.session.families[familyId]) return null;
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const res = await listFamilyRoleTemplates({
      sid: sessionCtx.sid,
      session: sessionCtx.session,
      clientIp,
      deviceId,
      familyId,
    });
    return res.items;
  } catch (err) {
    if (err instanceof GatewayError && (err.code === 'FORBIDDEN' || err.code === 'NOT_FOUND')) {
      redirect('/forbidden');
    }
    return null;
  }
}

export async function isFamilyKeeper(familyId: string): Promise<boolean> {
  const { fetchUserFamilies } = await import('@/server/data/user-families');
  const families = await fetchUserFamilies();
  const family = families?.find((f) => f.id === familyId);
  if (!family) return false;
  return family.role === 'keeper' || family.isOwner === true;
}
