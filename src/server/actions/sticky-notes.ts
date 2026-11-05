'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { getStickyNoteErrorMessage } from '@/lib/sticky-notes/errors';
import { assertStickyNoteRequestSize, sendStickyNotePayloadSchema } from '@/lib/sticky-notes/schemas';
import { zodFieldErrors } from '@/lib/forms/to-form-state';
import { gatewayActionContext } from '@/server/actions/request-context';
import { rethrowNextNavigation } from '@/server/actions/rethrow-navigation';
import { GatewayError } from '@/server/gateway/errors';
import {
  createStickyNote,
  deleteStickyNote,
  markStickyNoteRead,
} from '@/server/gateway/sticky-notes';
import { getSession } from '@/server/session/get-session';
import { withServerAction } from '@/server/session/with-session-handler';

export type SendStickyNoteState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
  retryAfter?: number;
  ok?: boolean;
};

export type StickyNoteMutationState = {
  formError?: string;
  ok?: boolean;
};

async function requireFamilySession(familyId: string) {
  const sessionCtx = await getSession();
  if (!sessionCtx) redirect('/session-ended');
  if (!sessionCtx.session.families[familyId]) redirect('/families');
  const { clientIp, deviceId } = await gatewayActionContext();
  return { ...sessionCtx, clientIp, deviceId, familyId };
}

export const sendStickyNoteAction = withServerAction(
  async (_prev: SendStickyNoteState, formData: FormData): Promise<SendStickyNoteState> => {
    try {
      const familyId = String(formData.get('familyId') ?? '');
      const recipientUserId = String(formData.get('recipientUserId') ?? '');
      const clientNoteId = String(formData.get('clientNoteId') ?? '') || randomUUID();
      const contentType = String(formData.get('contentType') ?? 'text');
      const contentCiphertext = String(formData.get('contentCiphertext') ?? '');
      const contentEnvelopeRaw = String(formData.get('contentEnvelope') ?? '');

      let contentEnvelope: unknown;
      try {
        contentEnvelope = JSON.parse(contentEnvelopeRaw);
      } catch {
        return { formError: getStickyNoteErrorMessage('BAD_REQUEST') };
      }

      const parsed = sendStickyNotePayloadSchema.safeParse({
        familyId,
        recipientUserId,
        clientNoteId,
        contentType,
        contentCiphertext,
        contentEnvelope,
      });
      if (!parsed.success) {
        return { fieldErrors: zodFieldErrors(parsed.error.flatten().fieldErrors) };
      }

      try {
        assertStickyNoteRequestSize(parsed.data);
      } catch {
        return { formError: getStickyNoteErrorMessage('BAD_REQUEST') };
      }

      const ctx = await requireFamilySession(parsed.data.familyId);
      await createStickyNote(
        {
          recipientUserId: parsed.data.recipientUserId,
          clientNoteId: parsed.data.clientNoteId,
          contentType: parsed.data.contentType,
          contentCiphertext: parsed.data.contentCiphertext,
          contentEnvelope: parsed.data.contentEnvelope,
        },
        ctx,
      );
      return { ok: true };
    } catch (err) {
      rethrowNextNavigation(err);
      if (err instanceof GatewayError) {
        return {
          formError: getStickyNoteErrorMessage(err.code, err.retryAfter),
          retryAfter: err.retryAfter,
        };
      }
      return { formError: getStickyNoteErrorMessage('UNKNOWN') };
    }
  },
);

export const markStickyNoteReadAction = withServerAction(
  async (_prev: StickyNoteMutationState, formData: FormData): Promise<StickyNoteMutationState> => {
    try {
      const familyId = String(formData.get('familyId') ?? '');
      const noteId = String(formData.get('noteId') ?? '');
      const ctx = await requireFamilySession(familyId);
      await markStickyNoteRead(ctx, noteId);
      return { ok: true };
    } catch (err) {
      rethrowNextNavigation(err);
      if (err instanceof GatewayError) {
        return { formError: getStickyNoteErrorMessage(err.code, err.retryAfter) };
      }
      return { formError: getStickyNoteErrorMessage('UNKNOWN') };
    }
  },
);

export const deleteStickyNoteAction = withServerAction(
  async (_prev: StickyNoteMutationState, formData: FormData): Promise<StickyNoteMutationState> => {
    try {
      const familyId = String(formData.get('familyId') ?? '');
      const noteId = String(formData.get('noteId') ?? '');
      const ctx = await requireFamilySession(familyId);
      await deleteStickyNote(ctx, noteId);
      return { ok: true };
    } catch (err) {
      rethrowNextNavigation(err);
      if (err instanceof GatewayError) {
        return { formError: getStickyNoteErrorMessage(err.code, err.retryAfter) };
      }
      return { formError: getStickyNoteErrorMessage('UNKNOWN') };
    }
  },
);
