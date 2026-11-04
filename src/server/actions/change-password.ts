'use server';

import { redirect } from 'next/navigation';
import { rethrowNextNavigation } from '@/server/actions/rethrow-navigation';
import { getErrorMessage } from '@/lib/messages';
import { changePasswordFormSchema } from '@/lib/forms/schemas';
import { GatewayError } from '@/server/gateway/errors';
import { workspaceChangePassword } from '@/server/gateway/auth';
import { gatewayActionContext } from '@/server/actions/request-context';
import { clearSignInFlow, requireSignInFlow } from '@/server/flows/signin-flow';
import { sanitizeNextParam } from '@/server/security/next-param';
import { setSessionCookie } from '@/server/session/cookies';
import { bindNewSession } from '@/server/session/get-session';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';
import { withServerAction } from '@/server/session/with-session-handler';

export type ChangePasswordState = {
  fieldErrors?: { oldPassword?: string; newPassword?: string; confirmPassword?: string };
  formError?: string;
};

async function changePasswordActionImpl(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const { fid, flow } = await requireSignInFlow('change-password');
  if (!flow.challengeId) redirect('/login');

  const parsed = changePasswordFormSchema.safeParse({
    oldPassword: formData.get('oldPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
    next: formData.get('next')?.toString(),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        oldPassword: flat.oldPassword?.[0],
        newPassword: flat.newPassword?.[0],
        confirmPassword: flat.confirmPassword?.[0],
      },
    };
  }

  const { oldPassword, newPassword } = parsed.data;
  if (newPassword === oldPassword) {
    return { fieldErrors: { newPassword: 'Новый пароль должен отличаться от временного' } };
  }

  const { clientIp, deviceId } = await gatewayActionContext();
  const next = sanitizeNextParam(parsed.data.next);

  if (!flow.deviceSession) {
    redirect('/login/verify-sms?reason=device-not-verified');
  }

  try {
    const session = await workspaceChangePassword(
      {
        challengeId: flow.challengeId,
        oldPassword,
        newPassword,
        deviceId,
      },
      { clientIp, deviceId, deviceSession: flow.deviceSession },
    );

    const guestMode = flow.trustDevice === false;
    const { sid } = await bindNewSession(
      sessionRecordFromAuthResponse(session, {
        deviceSession: flow.deviceSession,
        guestMode,
      }),
      { guestMode },
    );
    await setSessionCookie(sid, { guestMode });
    await clearSignInFlow(fid);
    redirect(next);
  } catch (err) {
    rethrowNextNavigation(err);
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      if (err.code === 'TEMP_PASSWORD_EXPIRED') {
        redirect('/login/temp-expired');
      }
      if (err.code === 'DEVICE_NOT_VERIFIED') {
        redirect('/login/verify-sms?reason=device-not-verified');
      }
      return { formError: getErrorMessage(err.code) };
    }
    throw err;
  }
}

export const changePasswordAction = withServerAction(changePasswordActionImpl);
