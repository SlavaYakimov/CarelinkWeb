'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { normalizeWorkspaceEmail } from '@/lib/workspace-email';
import {
  formatWorkspaceLogin,
  isValidWorkspaceSlug,
  normalizeWorkspaceSlug,
} from '@/lib/workspace-slug';
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
import { withServerAction } from '@/server/session/with-session-handler';

const workspaceSlugSchema = z
  .string()
  .trim()
  .min(3, 'Адрес семьи не короче 3 символов')
  .max(32, 'Слишком длинный адрес')
  .refine((v) => /^[a-z0-9-]+$/i.test(v), 'Только латиница, цифры и дефис')
  .refine((v) => isValidWorkspaceSlug(v), 'Только латиница, цифры и дефис, от 3 до 32 символов');

const signInSchema = z.object({
  workspaceSlug: z.string().min(1, 'Укажите адрес семьи').pipe(workspaceSlugSchema),
  password: z.string().min(8, 'Не короче 8 символов'),
  trustDevice: z
    .union([z.literal('on'), z.literal('true'), z.literal('1'), z.undefined()])
    .optional(),
  next: z.string().optional(),
});

export type SignInFormState = {
  formError?: string;
  fieldErrors?: { workspaceSlug?: string; password?: string };
  workspaceSlug?: string;
};

function credentialMessage(): string {
  return 'Неверный логин или пароль';
}

async function signInActionImpl(
  _prev: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const rawSlug = String(formData.get('workspaceSlug') ?? '');
  const parsed = signInSchema.safeParse({
    workspaceSlug: rawSlug,
    password: formData.get('password'),
    trustDevice: formData.get('trustDevice') ?? undefined,
    next: formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        workspaceSlug: flat.workspaceSlug?.[0],
        password: flat.password?.[0],
      },
      workspaceSlug: normalizeWorkspaceSlug(rawSlug),
    };
  }

  const { password, trustDevice } = parsed.data;
  const workspaceSlug = normalizeWorkspaceSlug(parsed.data.workspaceSlug);
  const workspaceEmail = normalizeWorkspaceEmail(formatWorkspaceLogin(workspaceSlug));
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
      const rawChannel = response.verificationChannel as string | undefined;
      const phoneFirst = Boolean(
        (response as { phoneVerificationRequired?: boolean }).phoneVerificationRequired ||
        (response as { requiresPhoneVerification?: boolean }).requiresPhoneVerification ||
        rawChannel === 'phone',
      );
      const fid = newFlowId();
      let step: string;
      let redirectTo: string;
      let verificationChannel: FlowRecord['verificationChannel'];
      if (phoneFirst) {
        step = 'verify-phone';
        redirectTo = '/login/verify-phone';
        verificationChannel =
          rawChannel === 'push' ? 'push' : rawChannel === 'delegate' ? 'delegate' : 'sms';
      } else if (rawChannel === 'push') {
        step = 'verify-push';
        redirectTo = '/login/verify-push';
        verificationChannel = 'push';
      } else if (rawChannel === 'delegate') {
        step = 'keeper-wait';
        redirectTo = '/login/keeper';
        verificationChannel = 'delegate';
      } else {
        step = 'verify-sms';
        redirectTo = '/login/verify-sms';
        verificationChannel = 'sms';
      }
      const flow: FlowRecord = {
        kind: 'signin',
        step,
        challengeId: response.challengeId,
        workspaceEmail,
        verificationChannel,
        trustDevice: !guestMode,
        createdAt: new Date().toISOString(),
      };
      await persistSignInFlow(fid, flow);
      redirect(redirectTo);
    }

    return {
      formError: 'Сервис вернул неожиданный ответ. Попробуйте позже.',
      workspaceSlug,
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
          workspaceSlug,
        };
      }
      return {
        formError: 'Не удалось войти. Проверьте логин и пароль.',
        workspaceSlug,
      };
    }
    throw err;
  }
}

/** Clears server session and sends user to login (used from session-ended). */
async function clearSessionAndRedirectToLoginImpl(): Promise<void> {
  const sid = await readSessionCookie();
  if (sid) {
    const loaded = await loadSession(sid);
    if (loaded) await deleteSession(sid, loaded.record.userId);
  }
  await clearSessionCookie();
  await clearSignInFlow();
  redirect('/login');
}

export const signInAction = withServerAction(signInActionImpl);
export const clearSessionAndRedirectToLogin = withServerAction(clearSessionAndRedirectToLoginImpl);
