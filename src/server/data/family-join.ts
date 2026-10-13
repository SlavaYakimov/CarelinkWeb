import 'server-only';
import { gatewayDataContext } from '@/server/actions/request-context';
import { createOrRefreshFamilyJoinLink, listFamilyJoinRequests } from '@/server/gateway/join';
import { GatewayError } from '@/server/gateway/errors';
import { getSession } from '@/server/session/get-session';

/**
 * CarelinkAuth @ 8b58b61: only POST /v1/families/{id}/join-links (no GET).
 * Initial page load issues join link via POST; refresh is explicit in UI.
 */
export async function fetchFamilyJoinLink(familyId: string) {
  const sessionCtx = await getSession();
  if (!sessionCtx) return null;
  const { clientIp, deviceId } = await gatewayDataContext();
  try {
    return await createOrRefreshFamilyJoinLink({
      sid: sessionCtx.sid,
      session: sessionCtx.session,
      familyId,
      clientIp,
      deviceId,
    });
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
  const { clientIp, deviceId } = await gatewayDataContext();
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
