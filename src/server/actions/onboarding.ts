'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/messages';
import { isPasswordStrongEnough } from '@/lib/password-rules';
import { maskRuPhoneE164, normalizeRuPhone } from '@/lib/phone';
import {
  formatWorkspaceLogin,
  isValidWorkspaceSlug,
  normalizeEmailOtp,
  normalizeWorkspaceSlug,
} from '@/lib/workspace-slug';
import { GatewayError } from '@/server/gateway/errors';
import {
  onboardingConfirmDevice,
  onboardingDeviceVerifyRequestSms,
  onboardingDeviceVerifyVerifySms,
  onboardingFinalizeWorkspace,
  onboardingRequestEmail,
  onboardingRequestPhoneOtp,
  onboardingSetupPassword,
  onboardingVerifyEmail,
  onboardingVerifyEmailLink,
  onboardingVerifyPhone,
} from '@/server/gateway/onboarding';
import { gatewayActionContext } from '@/server/actions/request-context';
import {
  clearOnboardingFlow,
  persistOnboardingFlow,
  requireOnboardingFlow,
} from '@/server/flows/onboarding-flow';
import { setSessionCookie } from '@/server/session/cookies';
import { bindNewSession, getSession } from '@/server/session/get-session';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';
import { newFlowId } from '@/server/session/store';
import type { FlowRecord } from '@/server/session/types';
import { withServerAction } from '@/server/session/with-session-handler';

const emailSchema = z.object({
  email: z.string().email('Укажите корректную почту'),
});

const emailOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4, 'Введите код из письма'),
});

const phoneSchema = z.object({
  phone: z.string().min(1, 'Укажите номер телефона'),
  displayName: z.string().min(1, 'Укажите, как к вам обращаться').max(128),
});

const phoneOtpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Введите все 6 цифр кода'),
});

const deviceOtpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Введите все 6 цифр кода'),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Не короче 8 символов'),
    confirmPassword: z.string().min(8),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  .refine((v) => isPasswordStrongEnough(v.newPassword), {
    message: 'Пароль не соответствует требованиям',
    path: ['newPassword'],
  });

const workspaceSchema = z.object({
  workspaceSlug: z
    .string()
    .min(3, 'Не короче 3 символов')
    .max(32)
    .refine((v) => isValidWorkspaceSlug(v), 'Только латиница, цифры и дефис'),
  displayName: z.string().min(1, 'Укажите название семьи').max(128),
});

export type OnboardingEmailState = { error?: string; sent?: boolean; email?: string };
export type OnboardingEmailOtpState = { error?: string };
export type OnboardingPhoneState = { error?: string; smsSent?: boolean; phoneMasked?: string };
export type OnboardingPhoneOtpState = { error?: string; attemptsHint?: string };
export type OnboardingDeviceState = { error?: string; smsSent?: boolean };
export type OnboardingDeviceOtpState = { error?: string };
export type OnboardingPasswordState = {
  fieldErrors?: { newPassword?: string; confirmPassword?: string };
  formError?: string;
};
export type OnboardingWorkspaceState = {
  fieldErrors?: { workspaceSlug?: string; displayName?: string };
  formError?: string;
  slugPreview?: string;
};

function baseOnboardingFlow(): FlowRecord {
  return {
    kind: 'onboarding',
    step: 'email',
    createdAt: new Date().toISOString(),
  };
}

async function requestOnboardingEmailActionImpl(
  _prev: OnboardingEmailState,
  formData: FormData,
): Promise<OnboardingEmailState> {
  const parsed = emailSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.email?.[0] };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { clientIp, deviceId } = await gatewayActionContext();

  await clearOnboardingFlow();
  const fid = newFlowId();
  await persistOnboardingFlow(fid, baseOnboardingFlow());

  try {
    await onboardingRequestEmail({ email }, { clientIp, deviceId });
    const flow: FlowRecord = {
      ...baseOnboardingFlow(),
      personalEmail: email,
      step: 'email',
    };
    await persistOnboardingFlow(fid, flow);
    return { sent: true, email };
  } catch (err) {
    await clearOnboardingFlow(fid);
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      return { error: getErrorMessage(err.code), email };
    }
    throw err;
  }
}

async function verifyOnboardingEmailActionImpl(
  _prev: OnboardingEmailOtpState,
  formData: FormData,
): Promise<OnboardingEmailOtpState> {
  const parsed = emailOtpSchema.safeParse({
    email: formData.get('email'),
    code: formData.get('code'),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return { error: flat.code?.[0] ?? flat.email?.[0] };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const code = normalizeEmailOtp(parsed.data.code);
  if (code.length < 6) {
    return { error: 'Введите код из письма (6 цифр)' };
  }

  const { fid } = await requireOnboardingFlow('email');
  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    const verified = await onboardingVerifyEmail({ email, code }, { clientIp, deviceId });
    const flow: FlowRecord = {
      kind: 'onboarding',
      step: 'phone',
      personalEmail: email,
      onboardingChallengeId: verified.onboardingChallengeId,
      workspaceSlug: verified.workspaceSlug,
      provisionalWorkspaceEmail: verified.workspaceEmail,
      createdAt: new Date().toISOString(),
    };
    await persistOnboardingFlow(fid, flow);
    redirect('/onboarding/phone');
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      if (err.code === 'EMAIL_TAKEN') {
        return { error: getErrorMessage('EMAIL_TAKEN') };
      }
      return { error: getErrorMessage(err.code) };
    }
    throw err;
  }
}

async function verifyOnboardingEmailLinkActionImpl(token: string): Promise<void> {
  const trimmed = token.trim();
  if (!trimmed) redirect('/onboarding/email');

  const { clientIp, deviceId } = await gatewayActionContext();
  await clearOnboardingFlow();
  const fid = newFlowId();

  try {
    const verified = await onboardingVerifyEmailLink(trimmed, { clientIp, deviceId });
    const flow: FlowRecord = {
      kind: 'onboarding',
      step: 'phone',
      onboardingChallengeId: verified.onboardingChallengeId,
      workspaceSlug: verified.workspaceSlug,
      provisionalWorkspaceEmail: verified.workspaceEmail,
      createdAt: new Date().toISOString(),
    };
    await persistOnboardingFlow(fid, flow);
    redirect('/onboarding/phone');
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      redirect('/onboarding/email?link=invalid');
    }
    throw err;
  }
}

async function sendOnboardingPhoneOtpActionImpl(
  _prev: OnboardingPhoneState,
  formData: FormData,
): Promise<OnboardingPhoneState> {
  const { fid, flow } = await requireOnboardingFlow('phone');
  const parsed = phoneSchema.safeParse({
    phone: formData.get('phone'),
    displayName: formData.get('displayName'),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return { error: flat.phone?.[0] ?? flat.displayName?.[0] };
  }

  const phoneE164 = normalizeRuPhone(parsed.data.phone);
  if (!phoneE164) {
    return { error: 'Введите номер в формате +7 …' };
  }

  const onboardingChallengeId = flow.onboardingChallengeId;
  if (!onboardingChallengeId) redirect('/onboarding/email');

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    await onboardingRequestPhoneOtp(
      { onboardingChallengeId, phone: phoneE164 },
      { clientIp, deviceId },
    );
    await persistOnboardingFlow(fid, {
      ...flow,
      phoneE164,
      keeperDisplayName: parsed.data.displayName.trim(),
      smsSentAt: new Date().toISOString(),
    });
    return { smsSent: true, phoneMasked: maskRuPhoneE164(phoneE164) };
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      return { error: getErrorMessage(err.code) };
    }
    throw err;
  }
}

async function confirmOnboardingPhoneOtpActionImpl(
  _prev: OnboardingPhoneOtpState,
  formData: FormData,
): Promise<OnboardingPhoneOtpState> {
  const { fid, flow } = await requireOnboardingFlow('phone');
  const parsed = phoneOtpSchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.code?.[0] };
  }

  const phoneE164 = flow.phoneE164;
  const onboardingChallengeId = flow.onboardingChallengeId;
  const displayName = flow.keeperDisplayName;
  if (!phoneE164 || !onboardingChallengeId || !displayName) {
    return { error: 'Сначала укажите телефон и запросите SMS.' };
  }

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    const verified = await onboardingVerifyPhone(
      {
        onboardingChallengeId,
        phone: phoneE164,
        code: parsed.data.code,
        displayName,
      },
      { clientIp, deviceId },
    );

    if (verified.existingUser) {
      await clearOnboardingFlow(fid);
      redirect('/login?reason=phone-registered');
    }

    const updated: FlowRecord = {
      ...flow,
      step: 'device',
      userId: verified.userId,
      onboardingChallengeId: verified.onboardingChallengeId,
    };
    await persistOnboardingFlow(fid, updated);
    redirect('/onboarding/device');
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      if (err.code === 'INVALID_OTP') {
        return {
          error: getErrorMessage('INVALID_OTP'),
          attemptsHint: 'После 5 неверных попыток ввод кода временно блокируется',
        };
      }
      if (err.code === 'ONBOARDING_STEP_ORDER') {
        redirect('/onboarding/email');
      }
      return { error: getErrorMessage(err.code) };
    }
    throw err;
  }
}

async function sendOnboardingDeviceSmsActionImpl(
  ..._args: [OnboardingDeviceState, FormData?]
): Promise<OnboardingDeviceState> {
  void _args;
  const { fid, flow } = await requireOnboardingFlow('device');
  const onboardingChallengeId = flow.onboardingChallengeId;
  const userId = flow.userId;
  const phoneE164 = flow.phoneE164;
  if (!onboardingChallengeId || !userId || !phoneE164) {
    redirect('/onboarding/phone');
  }

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    await onboardingDeviceVerifyRequestSms(
      { onboardingChallengeId, userId, deviceId, phone: phoneE164 },
      { clientIp, deviceId },
    );
    await persistOnboardingFlow(fid, { ...flow, smsSentAt: new Date().toISOString() });
    return { smsSent: true };
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      return { error: getErrorMessage(err.code) };
    }
    throw err;
  }
}

async function confirmOnboardingDeviceSmsActionImpl(
  _prev: OnboardingDeviceOtpState,
  formData: FormData,
): Promise<OnboardingDeviceOtpState> {
  const { fid, flow } = await requireOnboardingFlow('device');
  const parsed = deviceOtpSchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.code?.[0] };
  }

  const onboardingChallengeId = flow.onboardingChallengeId;
  const userId = flow.userId;
  const phoneE164 = flow.phoneE164;
  if (!onboardingChallengeId || !userId || !phoneE164) {
    redirect('/onboarding/phone');
  }

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    const verified = await onboardingDeviceVerifyVerifySms(
      {
        onboardingChallengeId,
        userId,
        deviceId,
        phone: phoneE164,
        code: parsed.data.code,
      },
      { clientIp, deviceId },
    );
    const deviceSession = verified.deviceSession;
    if (!deviceSession) {
      return { error: getErrorMessage('CONTRACT_MISMATCH') };
    }

    const confirm = await onboardingConfirmDevice(
      { onboardingChallengeId, userId, deviceId },
      { clientIp, deviceId, deviceSession },
    );

    const updated: FlowRecord = {
      ...flow,
      step: 'password',
      deviceSession,
      userRefresh: confirm.userRefresh,
      onboardingChallengeId: confirm.onboardingChallengeId,
    };
    await persistOnboardingFlow(fid, updated);
    redirect('/onboarding/password');
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      if (err.code === 'INVALID_OTP') {
        return { error: getErrorMessage('INVALID_OTP') };
      }
      return { error: getErrorMessage(err.code) };
    }
    throw err;
  }
}

async function setupOnboardingPasswordActionImpl(
  _prev: OnboardingPasswordState,
  formData: FormData,
): Promise<OnboardingPasswordState> {
  const { fid, flow } = await requireOnboardingFlow('password');
  const parsed = passwordSchema.safeParse({
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
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

  const onboardingChallengeId = flow.onboardingChallengeId;
  const userRefresh = flow.userRefresh;
  if (!onboardingChallengeId || !userRefresh) {
    redirect('/onboarding/device');
  }

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    const result = await onboardingSetupPassword(
      {
        onboardingChallengeId,
        newPassword: parsed.data.newPassword,
        deviceId,
      },
      { clientIp, deviceId, userRefresh },
    );

    const guestMode = false;
    const { sid } = await bindNewSession(
      sessionRecordFromAuthResponse(result.session, {
        deviceSession: flow.deviceSession ?? '',
        guestMode,
      }),
      { guestMode },
    );
    await setSessionCookie(sid, { guestMode });

    const updated: FlowRecord = {
      ...flow,
      step: result.requiresWorkspaceFinalize ? 'workspace' : 'done',
      userRefresh: result.session.userRefresh,
    };
    await persistOnboardingFlow(fid, updated);

    if (result.requiresWorkspaceFinalize) {
      redirect('/onboarding/workspace');
    }
    redirect('/onboarding/done');
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      return { formError: getErrorMessage(err.code) };
    }
    throw err;
  }
}

async function finalizeOnboardingWorkspaceActionImpl(
  _prev: OnboardingWorkspaceState,
  formData: FormData,
): Promise<OnboardingWorkspaceState> {
  const { fid, flow } = await requireOnboardingFlow('workspace');
  const parsed = workspaceSchema.safeParse({
    workspaceSlug: formData.get('workspaceSlug'),
    displayName: formData.get('displayName'),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        workspaceSlug: flat.workspaceSlug?.[0],
        displayName: flat.displayName?.[0],
      },
      slugPreview: formatWorkspaceLogin(String(formData.get('workspaceSlug') ?? '')),
    };
  }

  const slug = normalizeWorkspaceSlug(parsed.data.workspaceSlug);
  const onboardingChallengeId = flow.onboardingChallengeId;
  if (!onboardingChallengeId) redirect('/onboarding/email');

  const sessionCtx = await getSession();
  if (!sessionCtx || !flow.deviceSession) {
    redirect('/onboarding/password');
  }

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    const finalized = await onboardingFinalizeWorkspace(
      {
        onboardingChallengeId,
        workspaceSlug: slug,
        displayName: parsed.data.displayName.trim(),
      },
      {
        clientIp,
        deviceId,
        deviceSession: flow.deviceSession,
        sid: sessionCtx.sid,
        session: sessionCtx.session,
      },
    );

    const updated: FlowRecord = {
      ...flow,
      step: 'done',
      finalizedWorkspaceEmail: finalized.workspaceEmail,
      finalizedWorkspaceSlug: finalized.workspaceSlug,
      finalizedDisplayName: finalized.displayName,
      workspaceSlug: finalized.workspaceSlug,
    };
    await persistOnboardingFlow(fid, updated);
    redirect('/onboarding/done');
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
      }
      if (err.code === 'PASSWORD_SETUP_REQUIRED') {
        redirect('/onboarding/password');
      }
      if (err.code === 'WORKSPACE_SLUG_TAKEN') {
        return {
          formError: 'Этот адрес семьи уже занят. Попробуйте другой вариант.',
          slugPreview: formatWorkspaceLogin(slug),
        };
      }
      return { formError: getErrorMessage(err.code), slugPreview: formatWorkspaceLogin(slug) };
    }
    throw err;
  }
}

export const requestOnboardingEmailAction = withServerAction(requestOnboardingEmailActionImpl);
export const verifyOnboardingEmailAction = withServerAction(verifyOnboardingEmailActionImpl);
export const verifyOnboardingEmailLinkAction = withServerAction(
  verifyOnboardingEmailLinkActionImpl,
);
export const sendOnboardingPhoneOtpAction = withServerAction(sendOnboardingPhoneOtpActionImpl);
export const confirmOnboardingPhoneOtpAction = withServerAction(
  confirmOnboardingPhoneOtpActionImpl,
);
export const sendOnboardingDeviceSmsAction = withServerAction(sendOnboardingDeviceSmsActionImpl);
export const confirmOnboardingDeviceSmsAction = withServerAction(
  confirmOnboardingDeviceSmsActionImpl,
);
export const setupOnboardingPasswordAction = withServerAction(setupOnboardingPasswordActionImpl);
export const finalizeOnboardingWorkspaceAction = withServerAction(
  finalizeOnboardingWorkspaceActionImpl,
);
