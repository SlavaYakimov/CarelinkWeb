'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isPlausibleWorkspaceEmail, normalizeWorkspaceEmail } from '@/lib/workspace-email';
import { GatewayError } from '@/server/gateway/errors';
import { workspaceSignIn } from '@/server/gateway/auth';
import { clearSignInFlow, persistSignInFlow } from '@/server/flows/signin-flow';
import { resolveClientIp } from '@/server/security/client-ip';
import { sanitizeNextParam } from '@/server/security/next-param';
import {
  clearSessionCookie,
  ensureDeviceCookie,
  readSessionCookie,
  setSessionCookie,
} from '@/server/session/cookies';
import { bindNewSession } from '@/server/session/get-session';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';
import { deleteSession, loadSession, newFlowId } from '@/server/session/store';
import type { FlowRecord } from '@/server/session/types';

const signInSchema = z.object({
  workspaceEmail: z
    .string()
    .min(1, 'Укажите workspace-логин')
    .refine(isPlausibleWorkspaceEmail, 'Проверьте формат логина'),
  password: z.string().min(8, 'Не короче 8 символов'),
  trustDevice: z
    .union([z.literal('on'), z.literal('true'), z.literal('1'), z.undefined()])
    .optional(),
  next: z.string().optional(),
});

export type SignInFormState = {
  formError?: string;
  fieldErrors?: { workspaceEmail?: string; password?: string };
  workspaceEmail?: string;
};

function credentialMessage(): string {
  return 'Неверный логин или пароль';
}

export async function signInAction(
  _prev: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const parsed = signInSchema.safeParse({
    workspaceEmail: formData.get('workspaceEmail'),
    password: formData.get('password'),
    trustDevice: formData.get('trustDevice') ?? undefined,
    next: formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        workspaceEmail: flat.workspaceEmail?.[0],
        password: flat.password?.[0],
      },
      workspaceEmail: String(formData.get('workspaceEmail') ?? ''),
    };
  }

  const { password, trustDevice } = parsed.data;
  const workspaceEmail = normalizeWorkspaceEmail(parsed.data.workspaceEmail);
  const next = sanitizeNextParam(parsed.data.next);
  const guestMode = trustDevice !== 'on' && trustDevice !== 'true' && trustDevice !== '1';

  const h = await headers();
  const clientIp = resolveClientIp({
    forwardedFor: h.get('x-forwarded-for'),
    realIp: h.get('x-real-ip'),
  });
  const deviceId = await ensureDeviceCookie();

  const oldSid = await readSessionCookie();
  if (oldSid) {
    const loaded = await loadSession(oldSid);
    if (loaded) await deleteSession(oldSid, loaded.record.userId);
    await clearSessionCookie();
  }
  await clearSignInFlow();

  try {
    const response = await workspaceSignIn(
      { workspaceEmail, password, deviceId },
      { clientIp, deviceId },
    );

    if (response.flow === 'shortcut' && response.session) {
      if (response.requiresPasswordChange) {
        const fid = newFlowId();
        const flow: FlowRecord = {
          kind: 'signin',
          step: 'change-password',
          challengeId: response.challengeId,
          workspaceEmail,
          trustDevice: !guestMode,
          createdAt: new Date().toISOString(),
        };
        await persistSignInFlow(fid, flow);
        redirect('/login/change-password');
      }

      const { sid } = await bindNewSession(
        sessionRecordFromAuthResponse(response.session, { guestMode }),
        { guestMode },
      );
      await setSessionCookie(sid, { guestMode });
      redirect(next);
    }

    if (response.flow === 'full' && response.challengeId) {
      const channel = response.verificationChannel === 'push' ? 'push' : 'sms';
      const fid = newFlowId();
      const flow: FlowRecord = {
        kind: 'signin',
        step: channel === 'sms' ? 'verify-sms' : 'verify-push',
        challengeId: response.challengeId,
        workspaceEmail,
        verificationChannel: channel,
        trustDevice: !guestMode,
        createdAt: new Date().toISOString(),
      };
      await persistSignInFlow(fid, flow);
      redirect(channel === 'sms' ? '/login/verify-sms' : '/login/verify-push');
    }

    return {
      formError: 'Сервис вернул неожиданный ответ. Попробуйте позже.',
      workspaceEmail,
    };
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        const retry = err.retryAfter ?? 60;
        redirect(`/login/too-many?retryAfter=${retry}`);
      }
      if (err.code === 'TEMP_PASSWORD_EXPIRED') {
        redirect('/login/temp-expired');
      }
      if (err.code === 'INVALID_CREDENTIALS' || err.code === 'WORKSPACE_NOT_FOUND') {
        return {
          fieldErrors: { password: credentialMessage() },
          formError: 'Не удалось войти. Проверьте логин и пароль.',
          workspaceEmail,
        };
      }
      return {
        formError: 'Не удалось войти. Проверьте логин и пароль.',
        workspaceEmail,
      };
    }
    throw err;
  }
}

/** Clears server session and sends user to login (used from session-ended). */
export async function clearSessionAndRedirectToLogin(): Promise<void> {
  const sid = await readSessionCookie();
  if (sid) {
    const loaded = await loadSession(sid);
    if (loaded) await deleteSession(sid, loaded.record.userId);
  }
  await clearSessionCookie();
  await clearSignInFlow();
  redirect('/login');
}
