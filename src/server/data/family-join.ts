import 'server-only';
import { gatewayActionContext } from '@/server/actions/request-context';
import {
  createOrRefreshFamilyJoinLink,
  getFamilyJoinLink,
  listFamilyJoinRequests,
} from '@/server/gateway/join';
import { GatewayError } from '@/server/gateway/errors';
import { getSession } from '@/server/session/get-session';

export async function fetchFamilyJoinLink(familyId: string) {
  const sessionCtx = await getSession();
  if (!sessionCtx) return null;
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const ctx = {
      sid: sessionCtx.sid,
      session: sessionCtx.session,
      familyId,
      clientIp,
      deviceId,
    };
    try {
      return await getFamilyJoinLink(ctx);
    } catch (inner) {
      if (inner instanceof GatewayError && inner.status === 404) {
        return await createOrRefreshFamilyJoinLink(ctx);
      }
      throw inner;
    }
  } catch (err) {
    if (err instanceof GatewayError && (err.status === 403 || err.status === 404)) {
      return null;
    }
    throw err;
  }
}

export async function fetchFamilyJoinRequests(familyId: string) {
  const sessionCtx = await getSession();
  if (!sessionCtx) return null;
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const res = await listFamilyJoinRequests({
      sid: sessionCtx.sid,
      session: sessionCtx.session,
      familyId,
      clientIp,
      deviceId,
    });
    return res.items;
  } catch (err) {
    if (err instanceof GatewayError && (err.status === 403 || err.status === 404)) {
      return null;
    }
    throw err;
  }
}
