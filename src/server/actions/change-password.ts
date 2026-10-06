'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/messages';
import { isPasswordStrongEnough } from '@/lib/password-rules';
import { GatewayError } from '@/server/gateway/errors';
import { workspaceChangePassword } from '@/server/gateway/auth';
import { gatewayActionContext } from '@/server/actions/request-context';
import {
  clearSignInFlow,
  pendingPasswordFromFlow,
  requireSignInFlow,
} from '@/server/flows/signin-flow';
import { eraseFlowPassword } from '@/server/flows/finish-sign-in';
import { sanitizeNextParam } from '@/server/security/next-param';
import { setSessionCookie } from '@/server/session/cookies';
import { bindNewSession } from '@/server/session/get-session';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';

const schema = z
  .object({
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
  fieldErrors?: { newPassword?: string; confirmPassword?: string };
  formError?: string;
};

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const { fid, flow } = await requireSignInFlow('change-password');
  const oldPassword = pendingPasswordFromFlow(flow);
  if (!oldPassword) redirect('/login');

  const parsed = schema.safeParse({
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
    next: formData.get('next')?.toString(),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        newPassword: flat.newPassword?.[0],
        confirmPassword: flat.confirmPassword?.[0],
      },
    };
  }

  if (parsed.data.newPassword === oldPassword) {
    return { fieldErrors: { newPassword: 'Не совпадает с временным' } };
  }

  const { clientIp, deviceId } = await gatewayActionContext();
  const next = sanitizeNextParam(parsed.data.next);

  try {
    const session = await workspaceChangePassword(
      {
        challengeId: flow.challengeId,
        oldPassword,
        newPassword: parsed.data.newPassword,
        deviceId,
      },
      { clientIp, deviceId, deviceSession: flow.deviceSession },
    );

    await eraseFlowPassword(fid, flow);
    const guestMode = flow.trustDevice === false;
    const { sid } = await bindNewSession(
      sessionRecordFromAuthResponse(session, {
        deviceSession: flow.deviceSession ?? '',
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
      return { formError: getErrorMessage(err.code) };
    }
    throw err;
  }
}
