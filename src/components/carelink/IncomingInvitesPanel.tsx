'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import {
  acceptMemberInviteAction,
  declineMemberInviteAction,
  type InviteMutationState,
} from '@/server/actions/invites';
import { FormAlert } from '@/components/carelink/FormAlert';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { Button } from '@/components/ui/button';
import type { PendingMemberInvite } from '@/server/data/pending-invites';

const initial: InviteMutationState = {};

function InviteCard({ invite }: { invite: PendingMemberInvite }) {
  const [acceptState, acceptAction, accepting] = useActionState(acceptMemberInviteAction, initial);
  const [declineState, declineAction, declining] = useActionState(
    declineMemberInviteAction,
    initial,
  );

  const banner = acceptState.formError ?? declineState.formError;

  return (
    <li className="rounded-xl border border-border bg-card p-5 shadow-card">
      {banner ? <FormAlert message={banner} /> : null}
      <h2 className="text-lg font-semibold">{invite.familyName}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Роль: {invite.roleName}</p>
      <p className="text-sm text-muted-foreground">Пригласил: {invite.invitedByDisplayName}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Принять до {new Date(invite.expiresAt).toLocaleString('ru-RU')}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <form action={acceptAction}>
          <input type="hidden" name="inviteId" value={invite.id} />
          <SubmitButton pending={accepting} disabled={declining}>
            Принять
          </SubmitButton>
        </form>
        <form action={declineAction}>
          <input type="hidden" name="inviteId" value={invite.id} />
          <Button type="submit" variant="secondary" disabled={accepting || declining}>
            {declineState.ok ? 'Отклонено' : 'Отклонить'}
          </Button>
        </form>
      </div>
    </li>
  );
}

export function IncomingInvitesPanel({ invites }: { invites: PendingMemberInvite[] }) {
  if (invites.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <h2 className="text-lg font-semibold">Нет приглашений</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Когда семья пригласит вас, приглашение появится здесь.
        </p>
        <Button className="mt-6" asChild variant="secondary">
          <Link href="/families">На главную</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="mx-auto flex max-w-2xl flex-col gap-4">
      {invites.map((invite) => (
        <InviteCard key={invite.id} invite={invite} />
      ))}
    </ul>
  );
}
