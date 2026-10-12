import Link from 'next/link';
import { FamilyInviteRowActions } from '@/components/carelink/FamilyInviteRowActions';
import { Button } from '@/components/ui/button';
import { inviteCanResendOrRevoke, memberInviteStatusLabel } from '@/lib/invites/status-labels';
import type { MemberInviteView } from '@/server/data/family-invites';

export function FamilyInvitesList({
  familyId,
  invites,
  isKeeper,
}: {
  familyId: string;
  invites: MemberInviteView[];
  isKeeper: boolean;
}) {
  if (invites.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <h2 className="text-lg font-semibold">Пока никого не пригласили</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Пригласите близкого по личной почте — мы отправим инструкции для входа.
        </p>
        {isKeeper ? (
          <Button className="mt-6" asChild>
            <Link href={`/families/${familyId}/invites/new`}>Пригласить</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {isKeeper ? (
          <Button asChild>
            <Link href={`/families/${familyId}/invites/new`}>Пригласить</Link>
          </Button>
        ) : null}
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {invites.map((invite) => (
          <li
            key={invite.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{invite.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {invite.emailMasked ?? '—'} · {invite.roleName}
              </p>
              {isKeeper && invite.phone ? (
                <p className="text-sm text-muted-foreground">{invite.phone}</p>
              ) : null}
              <p className="mt-1 text-xs font-medium text-primary">
                {memberInviteStatusLabel(invite.status)}
              </p>
            </div>
            {isKeeper && inviteCanResendOrRevoke(invite.status) ? (
              <FamilyInviteRowActions familyId={familyId} inviteId={invite.id} canManage />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
