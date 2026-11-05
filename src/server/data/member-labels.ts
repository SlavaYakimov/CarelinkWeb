import 'server-only';
import { gatewayActionContext } from '@/server/actions/request-context';
import { GatewayError } from '@/server/gateway/errors';
import { listMemberLabels } from '@/server/gateway/member-labels';
import { getSession } from '@/server/session/get-session';
import type { components } from '@/server/gateway/types.gen';

export type MemberLabelView = components['schemas']['MemberLabelView'];

export async function fetchMemberLabels(familyId: string): Promise<MemberLabelView[] | null> {
  const sessionCtx = await getSession();
  if (!sessionCtx?.session.families[familyId]) return null;
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const res = await listMemberLabels({
      sid: sessionCtx.sid,
      session: sessionCtx.session,
      familyId,
      clientIp,
      deviceId,
    });
    return res.items;
  } catch (err) {
    if (err instanceof GatewayError) return null;
    throw err;
  }
}
