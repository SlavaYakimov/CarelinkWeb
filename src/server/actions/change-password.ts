'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/messages';
import { isPasswordStrongEnough } from '@/lib/password-rules';
import { GatewayError } from '@/server/gateway/errors';
import { workspaceChangePassword } from '@/server/gateway/auth';
import { gatewayActionContext } from '@/server/actions/request-context';
import { clearSignInFlow, requireSignInFlow } from '@/server/flows/signin-flow';
import { sanitizeNextParam } from '@/server/security/next-param';
import { setSessionCookie } from '@/server/session/cookies';
import { bindNewSession } from '@/server/session/get-session';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';

const schema = z
  .object({
    oldPassword: z.string().min(8, 'Не короче 8 символов'),
    newPassword: z.string().min(8, 'Не короче 8 символов'),
    confirmPassword: z.string().min(8),
    next: z.string().optional(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  .refine((v) => isPasswordStrongEnough(v.newPassword), {
    message: 'Пароль не соответствует требованиям',
    path: ['newPassword'],
  });

export type ChangePasswordState = {
  fieldErrors?: { oldPassword?: string; newPassword?: string; confirmPassword?: string };
  formError?: string;
};

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const { fid, flow } = await requireSignInFlow('change-password');
  if (!flow.challengeId) redirect('/login');

  const parsed = schema.safeParse({
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
