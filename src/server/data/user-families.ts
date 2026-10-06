import 'server-only';
import { gatewayActionContext } from '@/server/actions/request-context';
import { listUserFamilies } from '@/server/gateway/families';
import { getSession } from '@/server/session/get-session';
import type { components } from '@/server/gateway/types.gen';

export type FamilyListItem = components['schemas']['FamilyContext'];

export async function fetchUserFamilies(): Promise<FamilyListItem[] | null> {
  const ctx = await getSession();
  if (!ctx) return null;
  const { clientIp, deviceId } = await gatewayActionContext();
  const res = await listUserFamilies(
    {
      sid: ctx.sid,
      session: ctx.session,
      clientIp,
      deviceId,
      familyId: ctx.session.activeFamilyId,
    },
    { page: 1, limit: 24 },
  );
  if ('items' in res) return res.items;
  return null;
}
