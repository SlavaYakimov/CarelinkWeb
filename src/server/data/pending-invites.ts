import 'server-only';
import { gatewayActionContext } from '@/server/actions/request-context';
import {
  normalizePendingMemberInviteList,
  type PendingMemberInvite,
} from '@/lib/invites/normalize-pending-invite';
import { GatewayError } from '@/server/gateway/errors';
import { listPendingMemberInvites } from '@/server/gateway/invites';
import { getLogger } from '@/server/log/logger';
import { getSession } from '@/server/session/get-session';

export type { PendingMemberInvite };

export async function fetchPendingInvites(): Promise<PendingMemberInvite[] | null> {
  const sessionCtx = await getSession();
  if (!sessionCtx) return null;
  const log = getLogger();
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const res = await listPendingMemberInvites({
      sid: sessionCtx.sid,
      session: sessionCtx.session,
      clientIp,
      deviceId,
    });
    return normalizePendingMemberInviteList(res);
  } catch (err) {
    log.warn(
      {
        reason:
          err instanceof GatewayError
            ? err.code
            : err instanceof Error
              ? err.name
              : 'unknown',
      },
      'fetchPendingInvites failed',
    );
    return null;
  }
}

export async function countPendingInvites(): Promise<number> {
  const items = await fetchPendingInvites();
  return items?.length ?? 0;
}
