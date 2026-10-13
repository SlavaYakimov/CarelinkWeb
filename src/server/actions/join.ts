'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { rethrowNextNavigation } from '@/server/actions/rethrow-navigation';
import { gatewayActionContext } from '@/server/actions/request-context';
import {
  joinEmailFormSchema,
  joinEmailOtpFormSchema,
  joinCreateFamilyFormSchema,
  joinQrClientSchema,
  phoneRawToE164,
} from '@/lib/forms/schemas';
import { zodFieldErrors } from '@/lib/forms/to-form-state';
import { normalizeEmailOtp } from '@/lib/workspace-slug';
import { normalizeFamilySlug } from '@/lib/family-slug';
import { GatewayError } from '@/server/gateway/errors';
import {
  checkFamilySlug,
  joinEmailRequestCode,
  joinEmailVerifyCode,
  joinQrResolve,
  joinRedeem,
  pairApproveJoinRequest,
  pairRejectJoinRequest,
  createOrRefreshFamilyJoinLink,
} from '@/server/gateway/join';
import { createFamily } from '@/server/gateway/families';
import {
  clearJoinFlow,
  persistJoinFlow,
  readJoinFlow,
  requireJoinFlow,
  startJoinFlow,
} from '@/server/flows/join-flow';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';
import { getSession } from '@/server/session/get-session';
import { saveSession } from '@/server/session/store';
import { withServerAction } from '@/server/session/with-session-handler';

export type JoinEmailState = { error?: string; sent?: boolean; email?: string; sentAt?: string };
export type JoinEmailOtpState = {
  error?: string;
  fieldErrors?: { code?: string };
};
export type JoinQrFormState = {
  formError?: string;
  fieldErrors?: { displayName?: string; phone?: string };
};
export type JoinCreateFamilyState = {
  formError?: string;
  fieldErrors?: { name?: string; slug?: string };
};
export type JoinKeeperActionState = { error?: string };

function redirectJoinGatewayError(err: GatewayError): never {
  if (err.code === 'JOIN_LINK_EXPIRED' || err.code === 'INVALID_JOIN_TOKEN') {
    redirect('/join/unavailable?reason=expired');
  }
  if (err.code === 'ALREADY_IN_FAMILY') {
    redirect('/join/unavailable?reason=already_in_family');
  }
  throw err;
}

async function joinEmailRequestImpl(
  _prev: JoinEmailState,
  formData: FormData,
): Promise<JoinEmailState> {
  const parsed = joinEmailFormSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.email?.[0] ?? 'Укажите почту' };
  }
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    await joinEmailRequestCode({ email: parsed.data.email }, { clientIp, deviceId });
  } catch (err) {
    rethrowNextNavigation(err);
    if (err instanceof GatewayError && err.code === 'RATE_LIMIT') {
      return { error: 'Слишком много попыток. Попробуйте позже.' };
    }
    return { error: 'Не удалось отправить код. Попробуйте позже.' };
  }

  const ctx = await readJoinFlow();
  const fid = ctx?.fid ?? (await startJoinFlow());
  const flow = ctx?.flow ?? {
    kind: 'join' as const,
    step: 'email',
    createdAt: new Date().toISOString(),
  };
  await persistJoinFlow(fid, {
    ...flow,
    kind: 'join',
    step: 'verify',
    personalEmail: parsed.data.email,
    createdAt: flow.createdAt,
  });
  redirect('/invites/email/verify');
}

async function joinEmailVerifyImpl(
  _prev: JoinEmailOtpState,
  formData: FormData,
): Promise<JoinEmailOtpState> {
  const { flow, fid } = await requireJoinFlow('verify');
  const email = flow.personalEmail ?? String(formData.get('email') ?? '');
  const code = normalizeEmailOtp(String(formData.get('code') ?? ''));
  const parsed = joinEmailOtpFormSchema.safeParse({ email, code });
  if (!parsed.success) {
    const flat = zodFieldErrors(parsed.error.flatten().fieldErrors);
    return { fieldErrors: { code: flat.code ?? 'Введите 6 цифр' } };
  }

  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const verified = await joinEmailVerifyCode(
      { email: parsed.data.email, code: parsed.data.code },
      { clientIp, deviceId },
    );
    if (verified.registered) {
      await persistJoinFlow(fid, {
        ...flow,
        step: 'taken',
        emailVerificationTicket: verified.emailVerificationTicket,
        joinEmailRegistered: true,
        personalEmail: parsed.data.email,
      });
      redirect('/invites/email/taken');
    }

    const redeem = await joinRedeem(
      { kind: 'email', emailVerificationTicket: verified.emailVerificationTicket },
      { clientIp, deviceId },
    );
    if ('outcome' in redeem && redeem.outcome === 'choose_path' && 'userRefresh' in redeem) {
      await persistJoinFlow(fid, {
        ...flow,
        step: 'choice',
        emailVerificationTicket: verified.emailVerificationTicket,
        joinUserRefresh: redeem.userRefresh,
        personalEmail: parsed.data.email,
      });
      redirect('/join/choice');
    }
    return { error: 'Не удалось продолжить регистрацию.' };
  } catch (err) {
    rethrowNextNavigation(err);
    if (err instanceof GatewayError) {
      if (err.code === 'EMAIL_CODE_INVALID' || err.code === 'INVALID_OTP') {
        return { fieldErrors: { code: 'Неверный код' } };
      }
      if (err.code === 'EMAIL_CODE_EXPIRED') {
        return { error: 'Код устарел. Запросите новый.' };
      }
      if (err.code === 'RATE_LIMIT') {
        return { error: 'Слишком много попыток. Попробуйте позже.' };
      }
    }
    return { error: 'Не удалось проверить код. Попробуйте снова.' };
  }
}

async function joinEmailRedeemExistingImpl(): Promise<void> {
  const { flow, fid } = await requireJoinFlow('taken');
  if (!flow.emailVerificationTicket) redirect('/join/email');
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const result = await joinRedeem(
      { kind: 'email', emailVerificationTicket: flow.emailVerificationTicket },
      { clientIp, deviceId },
    );
    if ('outcome' in result && result.outcome === 'session' && 'session' in result) {
      redirect('/invites');
    }
    await clearJoinFlow(fid);
    redirect('/join/choice');
  } catch (err) {
    rethrowNextNavigation(err);
    if (err instanceof GatewayError) redirectJoinGatewayError(err);
    throw err;
  }
}

async function joinQrRedeemImpl(
  _prev: JoinQrFormState,
  formData: FormData,
): Promise<JoinQrFormState> {
  const ctx = await readJoinFlow();
  const joinToken = ctx?.flow.joinToken ?? String(formData.get('joinToken') ?? '');
  if (!joinToken) redirect('/join/unavailable?reason=invalid_token');

  const parsed = joinQrClientSchema.safeParse({
    displayName: formData.get('displayName'),
    phone: formData.get('phone'),
  });
  if (!parsed.success) {
    const flat = zodFieldErrors(parsed.error.flatten().fieldErrors);
    return {
      fieldErrors: {
        displayName: flat.displayName,
        phone: flat.phone,
      },
    };
  }
  const phoneE164 = phoneRawToE164(parsed.data.phone);
  if (!phoneE164) {
    return { fieldErrors: { phone: 'Укажите корректный номер' } };
  }

  const sessionCtx = await getSession();
  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    const result = await joinRedeem(
      {
        kind: 'qr',
        joinToken,
        registration: { displayName: parsed.data.displayName, phone: phoneE164 },
      },
      {
        clientIp,
        deviceId,
        sid: sessionCtx?.sid,
        session: sessionCtx?.session,
      },
    );

    if ('outcome' in result && result.outcome === 'pending_approval') {
      const fid = ctx?.fid ?? (await startJoinFlow({ joinToken }));
      await persistJoinFlow(fid, {
        kind: 'join',
        step: 'pending',
        joinToken,
        requestId: result.requestId,
        approvalSecret: result.approvalSecret,
        joinKeeperDisplayName: result.keeperDisplayName,
        displayName: parsed.data.displayName,
        phoneE164,
        createdAt: new Date().toISOString(),
      });
      redirect('/join/pending');
    }
    if ('outcome' in result && result.outcome === 'session' && 'session' in result && sessionCtx) {
      const patch = sessionRecordFromAuthResponse(result.session, {
        deviceSession: sessionCtx.session.deviceSession,
        guestMode: sessionCtx.session.guestMode,
      });
      await saveSession(sessionCtx.sid, {
        ...sessionCtx.session,
        ...patch,
        families: { ...sessionCtx.session.families, ...patch.families },
        lastSeenAt: new Date().toISOString(),
      });
      redirect('/families');
    }
    return { formError: 'Не удалось отправить заявку.' };
  } catch (err) {
    rethrowNextNavigation(err);
    if (err instanceof GatewayError) {
      if (err.code === 'ALREADY_IN_FAMILY') {
        redirect('/join/unavailable?reason=already_in_family');
      }
      if (err.code === 'JOIN_LINK_EXPIRED' || err.code === 'INVALID_JOIN_TOKEN') {
        redirect('/join/unavailable?reason=expired');
      }
      if (err.code === 'RATE_LIMIT') {
        return { formError: 'Слишком много попыток. Попробуйте позже.' };
      }
    }
    return { formError: 'Не удалось вступить. Попробуйте позже.' };
  }
}

async function joinCreateFamilyImpl(
  _prev: JoinCreateFamilyState,
  formData: FormData,
): Promise<JoinCreateFamilyState> {
  const { flow } = await requireJoinFlow('create-family');
  const parsed = joinCreateFamilyFormSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  });
  if (!parsed.success) {
    const flat = zodFieldErrors(parsed.error.flatten().fieldErrors);
    return {
      fieldErrors: {
        name: flat.name,
        slug: flat.slug,
      },
    };
  }

  const slug = normalizeFamilySlug(parsed.data.slug);
  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    const check = await checkFamilySlug(slug, {
      clientIp,
      deviceId,
      userRefresh: flow.joinUserRefresh,
    });
    if (!check.available) {
      return { fieldErrors: { slug: 'Это имя уже занято' } };
    }
  } catch (err) {
    rethrowNextNavigation(err);
    if (err instanceof GatewayError) {
      return { formError: 'Не удалось проверить адрес семьи.' };
    }
    throw err;
  }

  const sessionCtx = await getSession();
  if (!sessionCtx && !flow.joinUserRefresh) {
    redirect('/session-ended');
  }

  try {
    const response = await createFamily(
      { name: parsed.data.name, slug, unionRole: 'keeper' },
      sessionCtx
        ? {
            sid: sessionCtx.sid,
            session: sessionCtx.session,
            clientIp,
            deviceId,
            familyId: sessionCtx.session.activeFamilyId,
            idempotencyKey: randomUUID(),
          }
        : {
            sid: 'join-pre-session',
            session: {
              userId: '00000000-0000-0000-0000-000000000000',
              defaultFamilyId: '00000000-0000-0000-0000-000000000000',
              activeFamilyId: '00000000-0000-0000-0000-000000000000',
              userRefresh: flow.joinUserRefresh!,
              families: {},
              deviceSession: '',
              createdAt: new Date().toISOString(),
              lastSeenAt: new Date().toISOString(),
            },
            clientIp,
            deviceId,
            familyId: '00000000-0000-0000-0000-000000000000',
            userRefresh: flow.joinUserRefresh,
            idempotencyKey: randomUUID(),
          },
    );

    if (sessionCtx) {
      const patch = sessionRecordFromAuthResponse(response.session, {
        deviceSession: sessionCtx.session.deviceSession,
        guestMode: sessionCtx.session.guestMode,
      });
      await saveSession(sessionCtx.sid, {
        ...sessionCtx.session,
        ...patch,
        families: { ...sessionCtx.session.families, ...patch.families },
        activeFamilyId: response.id,
        lastSeenAt: new Date().toISOString(),
      });
    }
    await clearJoinFlow();
    redirect('/families');
  } catch (err) {
    rethrowNextNavigation(err);
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        return { formError: 'Слишком много попыток. Попробуйте позже.' };
      }
      return { formError: 'Не удалось создать семью. Попробуйте позже.' };
    }
    throw err;
  }
}

async function checkJoinFamilySlugImpl(slug: string): Promise<{
  available: boolean;
  slug: string;
  message?: string;
}> {
  const normalized = normalizeFamilySlug(slug);
  const joinCtx = await readJoinFlow();
  const flow = joinCtx?.flow;
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const res = await checkFamilySlug(normalized, {
      clientIp,
      deviceId,
      userRefresh: flow?.joinUserRefresh,
    });
    return { available: res.available, slug: res.slug };
  } catch (err) {
    if (err instanceof GatewayError) {
      return { available: false, slug: normalized, message: 'Не удалось проверить адрес' };
    }
    throw err;
  }
}

async function joinChoosePathImpl(path: 'create_family' | 'join_qr'): Promise<void> {
  const { flow, fid } = await requireJoinFlow('choice');
  await persistJoinFlow(fid, {
    ...flow,
    step: path === 'create_family' ? 'create-family' : 'qr',
  });
  redirect(path === 'create_family' ? '/join/create-family' : '/join');
}

async function refreshKeeperJoinLinkImpl(
  familyId: string,
): Promise<import('@/server/gateway/types.gen').components['schemas']['FamilyJoinLinkResponse']> {
  const sessionCtx = await getSession();
  if (!sessionCtx) redirect('/session-ended');
  const { clientIp, deviceId } = await gatewayActionContext();
  return createOrRefreshFamilyJoinLink({
    sid: sessionCtx.sid,
    session: sessionCtx.session,
    familyId,
    clientIp,
    deviceId,
  });
}

async function approveJoinRequestImpl(
  _prev: JoinKeeperActionState,
  formData: FormData,
): Promise<JoinKeeperActionState> {
  const requestId = String(formData.get('requestId') ?? '');
  const familyId = String(formData.get('familyId') ?? '');
  const sessionCtx = await getSession();
  if (!sessionCtx || !requestId || !familyId) {
    return { error: 'Не удалось одобрить заявку' };
  }
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    await pairApproveJoinRequest(
      { requestId },
      {
        sid: sessionCtx.sid,
        session: sessionCtx.session,
        familyId,
        clientIp,
        deviceId,
      },
    );
    redirect(`/families/${familyId}/join-requests`);
  } catch (err) {
    rethrowNextNavigation(err);
    return { error: 'Не удалось одобрить заявку' };
  }
}

async function rejectJoinRequestImpl(
  _prev: JoinKeeperActionState,
  formData: FormData,
): Promise<JoinKeeperActionState> {
  const requestId = String(formData.get('requestId') ?? '');
  const familyId = String(formData.get('familyId') ?? '');
  const sessionCtx = await getSession();
  if (!sessionCtx || !requestId || !familyId) {
    return { error: 'Не удалось отклонить заявку' };
  }
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    await pairRejectJoinRequest(
      { requestId },
      {
        sid: sessionCtx.sid,
        session: sessionCtx.session,
        familyId,
        clientIp,
        deviceId,
      },
    );
    redirect(`/families/${familyId}/join-requests`);
  } catch (err) {
    rethrowNextNavigation(err);
    return { error: 'Не удалось отклонить заявку' };
  }
}

export async function resolveJoinQrLanding(joinToken: string): Promise<void> {
  if (!joinToken.trim()) redirect('/join/unavailable?reason=invalid_token');
  const { clientIp, deviceId } = await gatewayActionContext();
  try {
    const preview = await joinQrResolve({ joinToken }, { clientIp, deviceId });
    const fid = await startJoinFlow({
      step: 'qr',
      joinToken: preview.joinToken ?? joinToken,
      joinFamilyName: preview.familyName,
      joinKeeperDisplayName: preview.keeperDisplayName,
      joinRoleLabel: preview.roleLabel,
      joinExpiresAt: preview.expiresAt,
    });
    void fid;
  } catch (err) {
    rethrowNextNavigation(err);
    if (err instanceof GatewayError) redirectJoinGatewayError(err);
    redirect('/join/unavailable?reason=expired');
  }
}

export const joinEmailRequestAction = withServerAction(joinEmailRequestImpl);
export const joinEmailVerifyAction = withServerAction(joinEmailVerifyImpl);
export const joinEmailRedeemExistingAction = withServerAction(
  async (_prev: JoinKeeperActionState): Promise<JoinKeeperActionState> => {
    await joinEmailRedeemExistingImpl();
    return {};
  },
);
export const joinQrRedeemAction = withServerAction(joinQrRedeemImpl);
export const joinCreateFamilyAction = withServerAction(joinCreateFamilyImpl);
export const checkJoinFamilySlugAction = checkJoinFamilySlugImpl;
export const joinChooseCreateFamilyAction = withServerAction(
  async (_prev: JoinKeeperActionState): Promise<JoinKeeperActionState> => {
    await joinChoosePathImpl('create_family');
    return {};
  },
);
export const joinChooseScanQrAction = withServerAction(
  async (_prev: JoinKeeperActionState): Promise<JoinKeeperActionState> => {
    await joinChoosePathImpl('join_qr');
    return {};
  },
);
export const refreshKeeperJoinLinkAction = refreshKeeperJoinLinkImpl;
export const approveJoinRequestAction = withServerAction(approveJoinRequestImpl);
export const rejectJoinRequestAction = withServerAction(rejectJoinRequestImpl);
