'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/messages';
import { maskRuPhoneE164, normalizeRuPhone } from '@/lib/phone';
import { GatewayError } from '@/server/gateway/errors';
import { workspaceSignInRequestSms, workspaceSignInVerifySms } from '@/server/gateway/auth';
import { finishSignInAfterDeviceVerified } from '@/server/flows/finish-sign-in';
import { persistSignInFlow, requireSignInFlow } from '@/server/flows/signin-flow';
import { gatewayActionContext } from '@/server/actions/request-context';

const phoneSchema = z.object({
  phone: z.string().min(1, 'Укажите номер телефона'),
});

const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Введите все 6 цифр кода'),
});

export type VerifySmsPhoneState = {
  error?: string;
  phoneMasked?: string;
  smsSent?: boolean;
};

export type VerifySmsOtpState = {
  error?: string;
  attemptsHint?: string;
};

export async function sendSignInSmsAction(
  _prev: VerifySmsPhoneState,
  formData: FormData,
): Promise<VerifySmsPhoneState> {
  const { fid, flow } = await requireSignInFlow('verify-sms');
  const parsed = phoneSchema.safeParse({ phone: formData.get('phone') });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.phone?.[0] };
  }

  const phoneE164 = normalizeRuPhone(parsed.data.phone);
  if (!phoneE164) {
    return { error: 'Введите номер в формате +7 …' };
  }

  const { clientIp, deviceId } = await gatewayActionContext();
  const challengeId = flow.challengeId;
  if (!challengeId) redirect('/login');

  try {
    await workspaceSignInRequestSms(
      { challengeId, deviceId, phone: phoneE164 },
      { clientIp, deviceId },
    );
    const updated = {
      ...flow,
      phoneE164,
      smsSentAt: new Date().toISOString(),
    };
    await persistSignInFlow(fid, updated);
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

export async function resendSignInSmsAction(): Promise<VerifySmsPhoneState> {
  const { fid, flow } = await requireSignInFlow('verify-sms');
  const phoneE164 = flow.phoneE164;
  const challengeId = flow.challengeId;
  if (!phoneE164 || !challengeId) redirect('/login');

  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    await workspaceSignInRequestSms(
      { challengeId, deviceId, phone: phoneE164 },
      { clientIp, deviceId },
    );
    await persistSignInFlow(fid, { ...flow, smsSentAt: new Date().toISOString() });
    return { smsSent: true, phoneMasked: maskRuPhoneE164(phoneE164) };
  } catch (err) {
    if (err instanceof GatewayError && err.code === 'RATE_LIMIT') {
      redirect(`/login/too-many?retryAfter=${err.retryAfter ?? 60}`);
    }
    if (err instanceof GatewayError) return { error: getErrorMessage(err.code) };
    throw err;
  }
}

export async function confirmSignInSmsAction(
  _prev: VerifySmsOtpState,
  formData: FormData,
): Promise<VerifySmsOtpState> {
  const { fid, flow } = await requireSignInFlow('verify-sms');
  const parsed = otpSchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.code?.[0] };
  }

  const { clientIp, deviceId } = await gatewayActionContext();
  const challengeId = flow.challengeId;
  const phoneE164 = flow.phoneE164;
  if (!challengeId || !phoneE164) {
    return { error: 'Сначала укажите номер и запросите SMS.' };
  }
  try {
    const verified = await workspaceSignInVerifySms(
      { challengeId, deviceId, phone: phoneE164, code: parsed.data.code },
      { clientIp, deviceId },
    );
    const deviceSession = verified.deviceSession;
    if (!deviceSession) {
      return { error: getErrorMessage('CONTRACT_MISMATCH') };
    }

    const updated = { ...flow, deviceSession };
    await persistSignInFlow(fid, updated);
    await finishSignInAfterDeviceVerified(fid, updated, {
      clientIp,
      deviceId,
      next: formData.get('next')?.toString(),
    });
    return {};
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
      if (err.code === 'SIGN_IN_STEP_ORDER') {
        redirect('/login');
      }
      return { error: getErrorMessage(err.code) };
    }
    throw err;
  }
}
