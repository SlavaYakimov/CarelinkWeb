'use server';

import { redirect } from 'next/navigation';
import { authLogout } from '@/server/gateway/auth';
import { gatewayActionContext } from '@/server/actions/request-context';
import { getSession } from '@/server/session/get-session';
import { clearFlowCookie, clearSessionCookie } from '@/server/session/cookies';
import { deleteSession } from '@/server/session/store';

export async function logoutAction(): Promise<void> {
  const ctx = await getSession();
  const { clientIp, deviceId } = await gatewayActionContext();

  if (ctx) {
    const familyId = ctx.session.activeFamilyId;
    const tokens = ctx.session.families[familyId];
    if (tokens?.access && tokens.refresh) {
      try {
        await authLogout(
          { refresh: tokens.refresh, allDevices: false },
          { clientIp, deviceId, accessToken: tokens.access },
        );
      } catch {
        // Best-effort revoke; local session is always cleared.
      }
    }
    await deleteSession(ctx.sid, ctx.session.userId);
  }

  await clearSessionCookie();
  await clearFlowCookie();
  redirect('/login');
}
