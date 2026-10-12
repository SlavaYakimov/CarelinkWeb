'use server';

import { redirect } from 'next/navigation';
import { rethrowNextNavigation } from '@/server/actions/rethrow-navigation';
import {
  phoneRawToE164,
  recoveryConfirmFormSchema,
  recoveryRequestFormSchema,
} from '@/lib/forms/schemas';
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
  const parsed = recoveryRequestFormSchema.safeParse({
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

  const phoneE164 = phoneRawToE164(parsed.data.phone);
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
    rethrowNextNavigation(err);
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
  const parsed = recoveryConfirmFormSchema.safeParse({
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
    rethrowNextNavigation(err);
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
