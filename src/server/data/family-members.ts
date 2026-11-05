import 'server-only';
import { GatewayError } from '@/server/gateway/errors';
import { listFamilyMembers } from '@/server/gateway/family-members';
import { gatewayActionContext } from '@/server/actions/request-context';
import { getSession } from '@/server/session/get-session';
import type { components } from '@/server/gateway/types.gen';

export type FamilyMemberView = components['schemas']['FamilyMemberView'];

export async function fetchFamilyMembers(familyId: string): Promise<FamilyMemberView[] | null> {
  const sessionCtx = await getSession();
  if (!sessionCtx?.session.families[familyId]) return null;
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const res = await listFamilyMembers({
      sid: sessionCtx.sid,
      session: sessionCtx.session,
      familyId,
      clientIp,
      deviceId,
    });
    return res.items;
  } catch (err) {
    if (err instanceof GatewayError && (err.status === 404 || err.status === 501)) {
      return null;
    }
    throw err;
  }
}
