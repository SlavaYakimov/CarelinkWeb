import { NextResponse } from 'next/server';
import { GatewayError } from '@/server/gateway/errors';
import { workspaceSignInDelegateStatus } from '@/server/gateway/auth';
import { interpretDelegateStatus, nextDelegatePollDelayMs } from '@/server/flows/delegate-poll';
import { persistSignInFlow, readSignInFlow } from '@/server/flows/signin-flow';
import { ensureDeviceCookie } from '@/server/session/cookies';
import { resolveClientIp } from '@/server/security/client-ip';
import { withRouteHandler } from '@/server/session/with-session-handler';
import { headers } from 'next/headers';

async function getDelegateStatus(request: Request) {
  const url = new URL(request.url);
  const attempt = Math.max(0, Number(url.searchParams.get('attempt') ?? '0') || 0);

  const flowCtx = await readSignInFlow();
  if (!flowCtx || flowCtx.flow.step !== 'keeper-wait') {
    return NextResponse.json({ error: 'NO_FLOW' }, { status: 401 });
  }

  const challengeId = flowCtx.flow.challengeId;
  if (!challengeId) {
    return NextResponse.json({ error: 'NO_CHALLENGE' }, { status: 400 });
  }

  const h = await headers();
  const clientIp = resolveClientIp({
    forwardedFor: h.get('x-forwarded-for'),
    realIp: h.get('x-real-ip'),
  });
  const deviceId = await ensureDeviceCookie();

  try {
    const statusRes = await workspaceSignInDelegateStatus(
      { challengeId, deviceId },
      { clientIp, deviceId },
    );
    const outcome = interpretDelegateStatus(statusRes.status, statusRes.deviceSession, attempt);

    if (outcome.kind === 'approved') {
      await persistSignInFlow(flowCtx.fid, {
        ...flowCtx.flow,
        deviceSession: outcome.deviceSession,
      });
      return NextResponse.json({ status: 'approved', nextPollMs: 0 });
    }
    if (outcome.kind === 'rejected') {
      return NextResponse.json({ status: 'rejected', nextPollMs: 0 });
    }
    if (outcome.kind === 'expired') {
      return NextResponse.json({ status: 'expired', nextPollMs: 0 });
    }

    return NextResponse.json({
      status: 'pending',
      nextPollMs: outcome.nextPollMs ?? nextDelegatePollDelayMs(attempt),
    });
  } catch (err) {
    if (err instanceof GatewayError && err.code === 'RATE_LIMIT') {
      return NextResponse.json(
        { status: 'rate_limit', retryAfter: err.retryAfter ?? 60 },
        { status: 429 },
      );
    }
    throw err;
  }
}

export const GET = withRouteHandler(getDelegateStatus);
