'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import {
  inviteIdSchema,
  lookupInviteEmailSchema,
  memberInviteFormSchema,
  phoneRawToE164,
} from '@/lib/forms/schemas';
import { zodFieldErrors } from '@/lib/forms/to-form-state';
import { gatewayActionContext } from '@/server/actions/request-context';
import { startInviteFlow } from '@/server/flows/invite-flow';
import { GatewayError } from '@/server/gateway/errors';
import {
  acceptMemberInvite,
  createMemberInvite,
  declineMemberInvite,
  lookupMemberInviteEmail,
  rebuildAuthSession,
  resendMemberInvite,
  revokeMemberInvite,
  uploadMemberInviteAvatar,
} from '@/server/gateway/invites';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';
import { getSession } from '@/server/session/get-session';
import { saveSession } from '@/server/session/store';
import { withServerAction } from '@/server/session/with-session-handler';
import { getInviteErrorMessage } from '@/lib/invites/error-messages';
import { toFormState } from '@/lib/forms/to-form-state';

const INVITE_FIELD_MAP = {
  EMAIL_UNDELIVERABLE: 'personalEmail',
  AVATAR_TOO_LARGE: 'avatarUrl',
  ALREADY_EXISTS: 'personalEmail',
  FORBIDDEN: 'form',
  NOT_IMPLEMENTED: 'form',
} as const;

export type InviteLookupState = {
  registered?: boolean;
  loading?: boolean;
  error?: string;
  retryAfter?: number;
};

export type CreateMemberInviteState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
  retryAfter?: number;
};

export type InviteMutationState = {
  formError?: string;
  ok?: boolean;
};

async function requireSessionFamily(familyId: string) {
  const sessionCtx = await getSession();
  if (!sessionCtx) redirect('/session-ended');
  if (!sessionCtx.session.families[familyId]) {
    redirect('/families');
  }
  const { clientIp, deviceId } = await gatewayActionContext();
  return {
    ...sessionCtx,
    clientIp,
    deviceId,
    familyId,
  };
}

async function requireSessionUser() {
  const sessionCtx = await getSession();
  if (!sessionCtx) redirect('/session-ended');
  const { clientIp, deviceId } = await gatewayActionContext();
  return { ...sessionCtx, clientIp, deviceId };
}

async function mergeSessionFromRebuild(
  sid: string,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>['session'],
  clientIp: string,
  deviceId: string,
) {
  const rebuilt = await rebuildAuthSession({
    sid,
    session,
    clientIp,
    deviceId,
  });
  const patch = sessionRecordFromAuthResponse(rebuilt, {
    deviceSession: session.deviceSession,
    guestMode: session.guestMode,
  });
  const merged = {
    ...session,
    ...patch,
    families: { ...session.families, ...patch.families },
    lastSeenAt: new Date().toISOString(),
  };
  await saveSession(sid, merged);
}

async function lookupMemberInviteEmailActionImpl(
  _prev: InviteLookupState,
  formData: FormData,
): Promise<InviteLookupState> {
  const familyId = String(formData.get('familyId') ?? '');
  const parsed = lookupInviteEmailSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.email?.[0] ?? 'Укажите почту' };
  }

  const ctx = await requireSessionFamily(familyId);

  try {
    const res = await lookupMemberInviteEmail(parsed.data, ctx);
    return { registered: res.registered };
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'FORBIDDEN' || err.code === 'NOT_FOUND') {
        redirect('/forbidden');
      }
      const mapped = toFormState(err, INVITE_FIELD_MAP, getInviteErrorMessage);
      return {
        registered: undefined,
        error: mapped.formError ?? mapped.fieldErrors?.personalEmail,
        retryAfter: mapped.retryAfter,
      };
    }
    throw err;
  }
}

export const lookupMemberInviteEmailAction = withServerAction(lookupMemberInviteEmailActionImpl);

async function createMemberInviteActionImpl(
  _prev: CreateMemberInviteState,
  formData: FormData,
): Promise<CreateMemberInviteState> {
  const familyId = String(formData.get('familyId') ?? '');
  const registeredHint = formData.get('registeredHint');
  const parsed = memberInviteFormSchema.safeParse({
    displayName: formData.get('displayName'),
    personalEmail: formData.get('personalEmail'),
    phone: formData.get('phone'),
    roleTemplateId: formData.get('roleTemplateId'),
    avatarUrl: formData.get('avatarUrl') || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const phoneE164 = phoneRawToE164(parsed.data.phone);
  if (!phoneE164) {
    return { fieldErrors: { phone: 'Проверьте формат телефона' } };
  }

  const ctx = await requireSessionFamily(familyId);

  let avatarUrl = parsed.data.avatarUrl || undefined;
  const avatarFile = formData.get('avatarFile');
  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      const uploaded = await uploadMemberInviteAvatar(avatarFile, ctx);
      avatarUrl = uploaded.avatarUrl;
    } catch (err) {
      if (err instanceof GatewayError) {
        const mapped = toFormState(err, INVITE_FIELD_MAP, getInviteErrorMessage);
        return {
          formError: mapped.formError,
          fieldErrors: mapped.fieldErrors,
        };
      }
      throw err;
    }
  }

  try {
    const createBody: Parameters<typeof createMemberInvite>[0] = {
      roleTemplateId: parsed.data.roleTemplateId,
      displayName: parsed.data.displayName,
      phone: phoneE164,
      personalEmail: parsed.data.personalEmail,
    };
    if (avatarUrl) {
      createBody.avatarUrl = avatarUrl;
    }

    const created = await createMemberInvite(createBody, { ...ctx, idempotencyKey: randomUUID() });

    const kind =
      created.inviteeKind ??
      (registeredHint === 'true' ? 'existing' : registeredHint === 'false' ? 'new' : 'new');
    redirect(`/families/${familyId}/invites/sent?kind=${kind === 'existing' ? 'existing' : 'new'}`);
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'FORBIDDEN' || err.code === 'NOT_FOUND') {
        redirect('/forbidden');
      }
      const mapped = toFormState(err, INVITE_FIELD_MAP, getInviteErrorMessage);
      return {
        formError: mapped.formError,
        fieldErrors: mapped.fieldErrors,
        retryAfter: mapped.retryAfter,
      };
    }
    throw err;
  }
}

export const createMemberInviteAction = withServerAction(createMemberInviteActionImpl);

async function resendMemberInviteActionImpl(
  _prev: InviteMutationState,
  formData: FormData,
): Promise<InviteMutationState> {
  const familyId = String(formData.get('familyId') ?? '');
  const inviteParsed = inviteIdSchema.safeParse(formData.get('inviteId'));
  if (!inviteParsed.success) return { formError: 'Неверное приглашение' };

  const ctx = await requireSessionFamily(familyId);
  try {
    await resendMemberInvite(inviteParsed.data, ctx);
    return { ok: true };
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'FORBIDDEN') redirect('/forbidden');
      return {
        formError: toFormState(err, INVITE_FIELD_MAP, getInviteErrorMessage).formError,
      };
    }
    throw err;
  }
}

export const resendMemberInviteAction = withServerAction(resendMemberInviteActionImpl);

async function revokeMemberInviteActionImpl(
  _prev: InviteMutationState,
  formData: FormData,
): Promise<InviteMutationState> {
  const familyId = String(formData.get('familyId') ?? '');
  const inviteParsed = inviteIdSchema.safeParse(formData.get('inviteId'));
  if (!inviteParsed.success) return { formError: 'Неверное приглашение' };

  const ctx = await requireSessionFamily(familyId);
  try {
    await revokeMemberInvite(inviteParsed.data, ctx);
    return { ok: true };
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'FORBIDDEN') redirect('/forbidden');
      return {
        formError: toFormState(err, INVITE_FIELD_MAP, getInviteErrorMessage).formError,
      };
    }
    throw err;
  }
}

export const revokeMemberInviteAction = withServerAction(revokeMemberInviteActionImpl);

async function acceptMemberInviteActionImpl(
  _prev: InviteMutationState,
  formData: FormData,
): Promise<InviteMutationState> {
  const inviteParsed = inviteIdSchema.safeParse(formData.get('inviteId'));
  if (!inviteParsed.success) return { formError: 'Неверное приглашение' };

  const ctx = await requireSessionUser();
  try {
    await acceptMemberInvite(inviteParsed.data, ctx);
    await mergeSessionFromRebuild(ctx.sid, ctx.session, ctx.clientIp, ctx.deviceId);
    redirect('/families');
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'FORBIDDEN') redirect('/invites/unavailable?reason=not_invitee');
      if (err.code === 'ALREADY_EXISTS' || err.status === 409) {
        redirect('/invites/unavailable?reason=already_member');
      }
      if (err.status === 400) redirect('/invites/unavailable?reason=not_pending');
      if (err.code === 'NOT_FOUND') redirect('/invites/unavailable?reason=not_found');
      return { formError: toFormState(err).formError };
    }
    throw err;
  }
}

export const acceptMemberInviteAction = withServerAction(acceptMemberInviteActionImpl);

async function declineMemberInviteActionImpl(
  _prev: InviteMutationState,
  formData: FormData,
): Promise<InviteMutationState> {
  const inviteParsed = inviteIdSchema.safeParse(formData.get('inviteId'));
  if (!inviteParsed.success) return { formError: 'Неверное приглашение' };

  const ctx = await requireSessionUser();
  try {
    await declineMemberInvite(inviteParsed.data, ctx);
    return { ok: true };
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'FORBIDDEN') redirect('/invites/unavailable?reason=not_invitee');
      if (err.status === 400) redirect('/invites/unavailable?reason=not_pending');
      if (err.code === 'NOT_FOUND') redirect('/invites/unavailable?reason=not_found');
      return { formError: toFormState(err).formError };
    }
    throw err;
  }
}

export const declineMemberInviteAction = withServerAction(declineMemberInviteActionImpl);

async function saveInviteCodeActionImpl(
  _prev: InviteMutationState,
  formData: FormData,
): Promise<InviteMutationState> {
  const code = String(formData.get('code') ?? '');
  await startInviteFlow(code);
  redirect('/login?next=/invites');
}

export const saveInviteCodeAction = withServerAction(saveInviteCodeActionImpl);
