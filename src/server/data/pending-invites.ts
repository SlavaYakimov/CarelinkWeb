import 'server-only';
import { gatewayActionContext } from '@/server/actions/request-context';
import { listPendingMemberInvites } from '@/server/gateway/invites';
import { getSession } from '@/server/session/get-session';
import type { components } from '@/server/gateway/types.gen';

export type PendingMemberInvite = components['schemas']['PendingMemberInviteView'];

export async function fetchPendingInvites(): Promise<PendingMemberInvite[] | null> {
  const sessionCtx = await getSession();
  if (!sessionCtx) return null;
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const res = await listPendingMemberInvites({
      sid: sessionCtx.sid,
      session: sessionCtx.session,
      clientIp,
      deviceId,
    });
    return res.items;
  } catch {
    return null;
  }
}

export async function countPendingInvites(): Promise<number> {
  const items = await fetchPendingInvites();
  return items?.length ?? 0;
}
