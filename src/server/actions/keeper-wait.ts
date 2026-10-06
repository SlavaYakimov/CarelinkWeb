'use server';

import { redirect } from 'next/navigation';
import { GatewayError } from '@/server/gateway/errors';
import { workspaceSignInRequestDelegatePush } from '@/server/gateway/auth';
import { finishSignInAfterDeviceVerified } from '@/server/flows/finish-sign-in';
import { persistSignInFlow, requireSignInFlow } from '@/server/flows/signin-flow';
import { gatewayActionContext } from '@/server/actions/request-context';

/** Dispatches delegate push to keeper (platform=web). Idempotent per page load. */
export async function requestKeeperDelegatePushAction(): Promise<{ ok: true } | { error: string }> {
  const { fid, flow } = await requireSignInFlow('keeper-wait');
  const challengeId = flow.challengeId;
  if (!challengeId) redirect('/login');

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    await workspaceSignInRequestDelegatePush(
      { challengeId, deviceId, platform: 'web' },
      { clientIp, deviceId },
    );
    await persistSignInFlow(fid, { ...flow, delegatePushSentAt: new Date().toISOString() });
    return { ok: true };
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      if (err.code === 'DELEGATE_NOT_ALLOWED') {
        redirect('/forbidden');
      }
      return { error: err.code };
    }
    throw err;
  }
}

export async function completeSignInAfterDelegateAction(next?: string): Promise<void> {
  const { fid, flow } = await requireSignInFlow('keeper-wait');
  if (!flow.deviceSession) redirect('/login/keeper');
  await finishSignInAfterDeviceVerified(fid, flow, {
    ...(await gatewayActionContext()),
    next,
  });
}
