'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { normalizeRuPhone } from '@/lib/phone';
import { gatewayActionContext } from '@/server/actions/request-context';
import {
  clearRecoveryFlow,
  persistRecoveryFlow,
  requireRecoveryFlow,
} from '@/server/flows/recovery-flow';
import { GatewayError } from '@/server/gateway/errors';
import { recoveryConfirm, recoveryRequest } from '@/server/gateway/recovery';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';
import { setSessionCookie } from '@/server/session/cookies';
import { bindNewSession } from '@/server/session/get-session';
import { newFlowId } from '@/server/session/store';
import type { FlowRecord } from '@/server/session/types';
import { withServerAction } from '@/server/session/with-session-handler';
import { sanitizeNextParam } from '@/server/security/next-param';

const requestSchema = z.object({
  familySlug: z
    .string()
    .trim()
    .min(3, 'Адрес семьи не короче 3 символов')
    .max(32, 'Слишком длинный адрес')
    .regex(/^[a-z0-9-]+$/, 'Только латиница, цифры и дефис'),
  phone: z.string().min(10, 'Укажите телефон'),
});

const confirmSchema = z.object({
  requestId: z.string().uuid('Укажите идентификатор из SMS'),
  code: z.string().regex(/^\d{4,6}$/, 'Код из SMS'),
  newPassword: z.string().min(8, 'Не короче 8 символов'),
  confirmPassword: z.string().min(8),
});

export type RecoveryRequestFormState = {
  formError?: string;
  fieldErrors?: { familySlug?: string; phone?: string };
};

export type RecoveryConfirmFormState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
};

async function recoveryRequestActionImpl(
  _prev: RecoveryRequestFormState,
  formData: FormData,
): Promise<RecoveryRequestFormState> {
  const parsed = requestSchema.safeParse({
    familySlug: formData.get('familySlug'),
    phone: formData.get('phone'),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        familySlug: flat.familySlug?.[0],
        phone: flat.phone?.[0],
      },
    };
  }

  const phoneE164 = normalizeRuPhone(parsed.data.phone);
  if (!phoneE164) {
    return { fieldErrors: { phone: 'Проверьте формат телефона' } };
  }

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    await recoveryRequest(
      { familySlug: parsed.data.familySlug, phone: phoneE164 },
      { clientIp, deviceId },
    );
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        return { formError: 'Слишком много запросов. Попробуйте позже.' };
      }
      if (err.code === 'NOT_IMPLEMENTED') {
        return { formError: 'Восстановление временно недоступно.' };
      }
    }
    // Anti-enumeration: same success path on expected errors
  }

  const fid = newFlowId();
  const flow: FlowRecord = {
    kind: 'recovery',
    step: 'sent',
    familySlug: parsed.data.familySlug,
    phoneE164,
    createdAt: new Date().toISOString(),
  };
  await persistRecoveryFlow(fid, flow);
  redirect('/login/recovery/sent');
}

async function recoveryConfirmActionImpl(
  _prev: RecoveryConfirmFormState,
  formData: FormData,
): Promise<RecoveryConfirmFormState> {
  const { flow } = await requireRecoveryFlow('sent');
  const parsed = confirmSchema.safeParse({
    requestId: formData.get('requestId'),
    code: formData.get('code'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])),
    };
  }
  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { fieldErrors: { confirmPassword: 'Пароли не совпадают' } };
  }

  const phoneE164 = flow.phoneE164;
  if (!phoneE164) redirect('/login/recovery');

  const { clientIp, deviceId } = await gatewayActionContext();
  const next = sanitizeNextParam(formData.get('next')?.toString());

  try {
    const session = await recoveryConfirm(
      {
        requestId: parsed.data.requestId,
        code: parsed.data.code,
        newPassword: parsed.data.newPassword,
        phone: phoneE164,
        deviceId,
      },
      { clientIp, deviceId },
    );

    await clearRecoveryFlow();
    const { sid } = await bindNewSession(sessionRecordFromAuthResponse(session, {}));
    await setSessionCookie(sid);
    redirect(next);
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        redirect('/login/too-many');
      }
      if (err.status === 410) {
        return {
          formError: 'Код использован или истёк. Запросите восстановление заново.',
        };
      }
      return { formError: 'Не удалось сменить пароль. Проверьте код и попробуйте снова.' };
    }
    throw err;
  }
}

export const recoveryRequestAction = withServerAction(recoveryRequestActionImpl);
export const recoveryConfirmAction = withServerAction(recoveryConfirmActionImpl);
