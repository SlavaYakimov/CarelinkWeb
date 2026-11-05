'use server';

import { redirect } from 'next/navigation';
import { MemberLabelBatchError } from '@/lib/member-labels/batch-error';
import { getMemberLabelErrorMessage } from '@/lib/member-labels/errors';
import { assignMemberLabelsSchema } from '@/lib/member-labels/schemas';
import { zodFieldErrors } from '@/lib/forms/to-form-state';
import { gatewayActionContext } from '@/server/actions/request-context';
import { rethrowNextNavigation } from '@/server/actions/rethrow-navigation';
import { GatewayError } from '@/server/gateway/errors';
import { createMemberLabels, deleteMemberLabel } from '@/server/gateway/member-labels';
import { getSession } from '@/server/session/get-session';
import { withServerAction } from '@/server/session/with-session-handler';

export type AssignMemberLabelsState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
  batchFailures?: { userId: string; reason: string }[];
  ok?: boolean;
};

export type MemberLabelDeleteState = {
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

export const assignMemberLabelsAction = withServerAction(
  async (_prev: AssignMemberLabelsState, formData: FormData): Promise<AssignMemberLabelsState> => {
    try {
      const familyId = String(formData.get('familyId') ?? '');
      const labelText = String(formData.get('labelText') ?? '');
      const rawIds = formData.getAll('targetUserIds').map(String);

      const parsed = assignMemberLabelsSchema.safeParse({
        familyId,
        labelText,
        targetUserIds: rawIds,
      });
      if (!parsed.success) {
        return { fieldErrors: zodFieldErrors(parsed.error.flatten().fieldErrors) };
      }

      const ctx = await requireFamilySession(parsed.data.familyId);
      await createMemberLabels(
        {
          labelText: parsed.data.labelText,
          targetUserIds: parsed.data.targetUserIds,
        },
        ctx,
      );
      return { ok: true };
    } catch (err) {
      rethrowNextNavigation(err);
      if (err instanceof MemberLabelBatchError) {
        return {
          formError: getMemberLabelErrorMessage('BAD_REQUEST'),
          batchFailures: err.rejectedTargets,
        };
      }
      if (err instanceof GatewayError) {
        return { formError: getMemberLabelErrorMessage(err.code) };
      }
      return { formError: getMemberLabelErrorMessage('UNKNOWN') };
    }
  },
);

export const deleteMemberLabelAction = withServerAction(
  async (_prev: MemberLabelDeleteState, formData: FormData): Promise<MemberLabelDeleteState> => {
    try {
      const familyId = String(formData.get('familyId') ?? '');
      const labelId = String(formData.get('labelId') ?? '');
      const ctx = await requireFamilySession(familyId);
      await deleteMemberLabel(ctx, labelId);
      return { ok: true };
    } catch (err) {
      rethrowNextNavigation(err);
      if (err instanceof GatewayError) {
        return { formError: getMemberLabelErrorMessage(err.code) };
      }
      return { formError: getMemberLabelErrorMessage('UNKNOWN') };
    }
  },
);
