import 'server-only';
import { gatewayActionContext } from '@/server/actions/request-context';
import { GatewayError } from '@/server/gateway/errors';
import { getStickyNoteWidget } from '@/server/gateway/sticky-notes';
import { getSession } from '@/server/session/get-session';
import type { components } from '@/server/gateway/types.gen';

export type StickyNoteView = components['schemas']['StickyNoteView'];

export async function fetchStickyNoteWidget(
  familyId: string,
): Promise<{ note: StickyNoteView | null } | null> {
  const sessionCtx = await getSession();
  if (!sessionCtx?.session.families[familyId]) return null;
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const res = await getStickyNoteWidget({
      sid: sessionCtx.sid,
      session: sessionCtx.session,
      familyId,
      clientIp,
      deviceId,
    });
    return { note: res.note ?? null };
  } catch (err) {
    if (err instanceof GatewayError) return { note: null };
    throw err;
  }
}
