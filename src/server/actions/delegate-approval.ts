'use server';

import { redirect } from 'next/navigation';
import { getErrorMessage } from '@/lib/messages';
import { GatewayError } from '@/server/gateway/errors';
import {
  workspaceSignInApproveDelegate,
  workspaceSignInDelegateDetails,
  workspaceSignInRejectDelegate,
} from '@/server/gateway/auth';
import { gatewayActionContext } from '@/server/actions/request-context';
import { clearDelegateFlow, requireDelegateToken } from '@/server/flows/delegate-flow';
import { handleDelegateGatewayError } from '@/server/flows/delegate-errors';
import { getSession } from '@/server/session/get-session';

export type DelegateApprovalState = {
  formError?: string;
  done?: 'approved' | 'rejected';
};

export async function loadDelegateDetailsForKeeper(token: string) {
  const trimmed = token.trim();
  if (!trimmed) {
    handleDelegateGatewayError(
      new GatewayError({ code: 'BAD_REQUEST', status: 400, message: 'BAD_REQUEST' }),
    );
  }
  const { clientIp, deviceId } = await gatewayActionContext();
  return workspaceSignInDelegateDetails(trimmed, { clientIp, deviceId });
}

export async function approveDelegateAction(): Promise<DelegateApprovalState> {
  const sessionCtx = await getSession();
  if (!sessionCtx) {
    redirect('/login?next=/delegate');
  }

  const { fid, token } = await requireDelegateToken();
  const { clientIp, deviceId } = await gatewayActionContext();
  const access = sessionCtx.session.families[sessionCtx.session.activeFamilyId]?.access;
  if (!access) {
    return { formError: getErrorMessage('UNAUTHORIZED') };
  }

  try {
    await workspaceSignInApproveDelegate({ token }, { clientIp, deviceId, accessToken: access });
    await clearDelegateFlow(fid);
    return { done: 'approved' };
  } catch (err) {
    handleDelegateGatewayError(err);
  }
}

export async function rejectDelegateAction(): Promise<DelegateApprovalState> {
  const sessionCtx = await getSession();
  if (!sessionCtx) {
    redirect('/login?next=/delegate');
  }

  const { fid, token } = await requireDelegateToken();
  const { clientIp, deviceId } = await gatewayActionContext();
  const access = sessionCtx.session.families[sessionCtx.session.activeFamilyId]?.access;
  if (!access) {
    return { formError: getErrorMessage('UNAUTHORIZED') };
  }

  try {
    await workspaceSignInRejectDelegate({ token }, { clientIp, deviceId, accessToken: access });
    await clearDelegateFlow(fid);
    return { done: 'rejected' };
  } catch (err) {
    handleDelegateGatewayError(err);
  }
}
