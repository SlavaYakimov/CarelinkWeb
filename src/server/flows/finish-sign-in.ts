import 'server-only';
import { redirect } from 'next/navigation';
import { GatewayError } from '@/server/gateway/errors';
import { workspaceSignInComplete } from '@/server/gateway/auth';
import {
  clearSignInFlow,
  pendingPasswordFromFlow,
  persistSignInFlow,
} from '@/server/flows/signin-flow';
import { sanitizeNextParam } from '@/server/security/next-param';
import { setSessionCookie } from '@/server/session/cookies';
import { bindNewSession } from '@/server/session/get-session';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';
import { saveFlow } from '@/server/session/store';
import type { FlowRecord } from '@/server/session/types';

function scrubPasswordFromFlow(flow: FlowRecord): FlowRecord {
  if (!flow.pendingPasswordEnc) return flow;
  const next = { ...flow };
  delete next.pendingPasswordEnc;
  return next;
}

/** After device SMS verified — complete sign-in and route to app or password change (Q4). */
export async function finishSignInAfterDeviceVerified(
  fid: string,
  flow: FlowRecord,
  ctx: { clientIp: string; deviceId: string; next?: string },
): Promise<never> {
  const next = sanitizeNextParam(ctx.next);
  const challengeId = flow.challengeId;
  const deviceSession = flow.deviceSession;
  const password = pendingPasswordFromFlow(flow);

  if (!challengeId || !deviceSession || !password) {
    redirect('/login');
  }

  try {
    const complete = await workspaceSignInComplete(
      { challengeId, password, deviceId: ctx.deviceId },
      { clientIp: ctx.clientIp, deviceId: ctx.deviceId, deviceSession },
    );

    const withoutPassword = scrubPasswordFromFlow(flow);

    if (complete.requiresPasswordChange) {
      const updated: FlowRecord = {
        ...withoutPassword,
        step: 'change-password',
        pendingPasswordEnc: flow.pendingPasswordEnc,
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

/** Wipes encrypted password blob from flow after password change succeeds. */
export async function eraseFlowPassword(fid: string, flow: FlowRecord): Promise<void> {
  if (!flow.pendingPasswordEnc) return;
  const updated = scrubPasswordFromFlow(flow);
  await saveFlow(fid, updated);
}
