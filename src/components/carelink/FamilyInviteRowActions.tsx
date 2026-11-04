'use client';

import { useActionState } from 'react';
import {
  resendMemberInviteAction,
  revokeMemberInviteAction,
  type InviteMutationState,
} from '@/server/actions/invites';
import { Button } from '@/components/ui/button';
import { FormAlert } from '@/components/carelink/FormAlert';

const initial: InviteMutationState = {};

export function FamilyInviteRowActions({
  familyId,
  inviteId,
  canManage,
}: {
  familyId: string;
  inviteId: string;
  canManage: boolean;
}) {
  const [resendState, resendAction, resending] = useActionState(resendMemberInviteAction, initial);
  const [revokeState, revokeAction, revoking] = useActionState(revokeMemberInviteAction, initial);

  if (!canManage) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {(resendState.formError || revokeState.formError) && (
        <FormAlert message={resendState.formError ?? revokeState.formError ?? ''} />
      )}
      <form action={resendAction}>
        <input type="hidden" name="familyId" value={familyId} />
        <input type="hidden" name="inviteId" value={inviteId} />
        <Button type="submit" variant="secondary" size="sm" disabled={resending || revoking}>
          {resendState.ok ? 'Письмо отправлено' : 'Отправить снова'}
        </Button>
      </form>
      <form action={revokeAction}>
        <input type="hidden" name="familyId" value={familyId} />
        <input type="hidden" name="inviteId" value={inviteId} />
        <Button type="submit" variant="ghost" size="sm" disabled={resending || revoking}>
          {revokeState.ok ? 'Отозвано' : 'Отозвать'}
        </Button>
      </form>
    </div>
  );
}
