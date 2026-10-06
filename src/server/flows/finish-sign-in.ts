import 'server-only';
import { redirect } from 'next/navigation';
import { GatewayError } from '@/server/gateway/errors';
import { workspaceSignInComplete } from '@/server/gateway/auth';
import { clearSignInFlow, persistSignInFlow } from '@/server/flows/signin-flow';
import { sanitizeNextParam } from '@/server/security/next-param';
import { setSessionCookie } from '@/server/session/cookies';
import { bindNewSession } from '@/server/session/get-session';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';
import type { FlowRecord } from '@/server/session/types';

/** After device verified (SMS) or delegate approved — complete sign-in (BE-06: no password). */
export async function finishSignInAfterDeviceVerified(
  fid: string,
  flow: FlowRecord,
  ctx: { clientIp: string; deviceId: string; next?: string },
): Promise<never> {
  const next = sanitizeNextParam(ctx.next);
  const challengeId = flow.challengeId;
  const deviceSession = flow.deviceSession;

  if (!challengeId || !deviceSession) {
    redirect('/login');
  }

  try {
    const complete = await workspaceSignInComplete(
      { challengeId, deviceId: ctx.deviceId },
      { clientIp: ctx.clientIp, deviceId: ctx.deviceId, deviceSession },
    );

    if (complete.requiresPasswordChange) {
      const updated: FlowRecord = {
        ...flow,
        step: 'change-password',
        deviceSession,
      };
      await persistSignInFlow(fid, updated);
      redirect('/login/change-password');
    }

    if (!complete.session) {
      redirect('/login');
    }

    const guestMode = flow.trustDevice === false;
    const { sid } = await bindNewSession(
      sessionRecordFromAuthResponse(complete.session, { deviceSession, guestMode }),
      { guestMode },
    );
    await setSessionCookie(sid, { guestMode });
    await clearSignInFlow(fid);
    redirect(next);
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      if (err.code === 'TEMP_PASSWORD_EXPIRED') {
        redirect('/login/temp-expired');
      }
      if (err.code === 'SIGN_IN_STEP_ORDER') {
        redirect('/login');
      }
    }
    throw err;
  }
}
