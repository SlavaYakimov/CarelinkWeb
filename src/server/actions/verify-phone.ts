'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/messages';
import { maskRuPhoneE164, normalizeRuPhone } from '@/lib/phone';
import { GatewayError } from '@/server/gateway/errors';
import { workspaceSignInRequestOtp, workspaceSignInVerifyPhone } from '@/server/gateway/auth';
import { persistSignInFlow, requireSignInFlow } from '@/server/flows/signin-flow';
import { gatewayActionContext } from '@/server/actions/request-context';
import { withServerAction } from '@/server/session/with-session-handler';

const phoneSchema = z.object({
  phone: z.string().min(1, 'Укажите номер телефона'),
});

const otpSchema = z.object({
  code: z.string().regex(/^\d{4}$/, 'Введите все 4 цифры кода'),
});

export type VerifyPhoneState = {
  error?: string;
  phoneMasked?: string;
  otpSent?: boolean;
};

export type VerifyPhoneOtpState = {
  error?: string;
  attemptsHint?: string;
};

function deviceStepAfterPhone(flow: import('@/server/session/types').FlowRecord): {
  step: string;
  path: string;
} {
  const channel = flow.verificationChannel;
  if (channel === 'push') return { step: 'verify-push', path: '/login/verify-push' };
  if (channel === 'delegate') return { step: 'keeper-wait', path: '/login/keeper' };
  return { step: 'verify-sms', path: '/login/verify-sms' };
}

async function sendSignInPhoneOtpActionImpl(
  _prev: VerifyPhoneState,
  formData: FormData,
): Promise<VerifyPhoneState> {
  const { fid, flow } = await requireSignInFlow('verify-phone');
  const parsed = phoneSchema.safeParse({ phone: formData.get('phone') });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.phone?.[0] };
  }

  const phoneE164 = normalizeRuPhone(parsed.data.phone);
  if (!phoneE164) {
    return { error: 'Введите номер в формате +7 …' };
  }

  const challengeId = flow.challengeId;
  if (!challengeId) redirect('/login');

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    await workspaceSignInRequestOtp({ challengeId, phone: phoneE164 }, { clientIp, deviceId });
    await persistSignInFlow(fid, {
      ...flow,
      phoneE164,
      smsSentAt: new Date().toISOString(),
    });
    return { otpSent: true, phoneMasked: maskRuPhoneE164(phoneE164) };
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

async function resendSignInPhoneOtpActionImpl(
  ..._args: [VerifyPhoneState, FormData?]
): Promise<VerifyPhoneState> {
  void _args;
  const { fid, flow } = await requireSignInFlow('verify-phone');
  const phoneE164 = flow.phoneE164;
  const challengeId = flow.challengeId;
  if (!phoneE164 || !challengeId) redirect('/login');

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    await workspaceSignInRequestOtp({ challengeId, phone: phoneE164 }, { clientIp, deviceId });
    await persistSignInFlow(fid, { ...flow, smsSentAt: new Date().toISOString() });
    return { otpSent: true, phoneMasked: maskRuPhoneE164(phoneE164) };
  } catch (err) {
    if (err instanceof GatewayError && err.code === 'RATE_LIMIT') {
      redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
    }
    if (err instanceof GatewayError) return { error: getErrorMessage(err.code) };
    throw err;
  }
}

async function confirmSignInPhoneOtpActionImpl(
  _prev: VerifyPhoneOtpState,
  formData: FormData,
): Promise<VerifyPhoneOtpState> {
  const { fid, flow } = await requireSignInFlow('verify-phone');
  const parsed = otpSchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.code?.[0] };
  }

  const challengeId = flow.challengeId;
  const phoneE164 = flow.phoneE164;
  if (!challengeId || !phoneE164) {
    return { error: 'Сначала укажите номер и запросите код.' };
  }

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    const verified = await workspaceSignInVerifyPhone(
      { challengeId, phone: phoneE164, code: parsed.data.code },
      { clientIp, deviceId },
    );
    if (!verified.phoneVerified) {
      return { error: getErrorMessage('CONTRACT_MISMATCH') };
    }

    const next = deviceStepAfterPhone(flow);
    await persistSignInFlow(fid, {
      ...flow,
      phoneVerified: true,
      step: next.step,
    });
    redirect(next.path);
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
      if (err.code === 'INVALID_CREDENTIALS') {
        return { error: 'Номер не совпадает с телефоном в семье.' };
      }
      if (err.code === 'SIGN_IN_STEP_ORDER') {
        redirect('/login');
      }
      return { error: getErrorMessage(err.code) };
    }
    throw err;
  }
}

export const sendSignInPhoneOtpAction = withServerAction(sendSignInPhoneOtpActionImpl);
export const resendSignInPhoneOtpAction = withServerAction(resendSignInPhoneOtpActionImpl);
export const confirmSignInPhoneOtpAction = withServerAction(confirmSignInPhoneOtpActionImpl);
