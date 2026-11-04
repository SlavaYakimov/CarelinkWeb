import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function InviteSentPanel({
  familyId,
  kind,
}: {
  familyId: string;
  kind: 'new' | 'existing';
}) {
  const isNew = kind === 'new';

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-xl border border-border bg-card p-8 shadow-card">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isNew ? 'Приглашение отправлено' : 'Приглашение ожидает принятия'}
      </h1>
      {isNew ? (
        <p className="text-sm text-muted-foreground">
          На личную почту ушли workspace-логин, временный пароль (72 часа) и ссылка с кодом
          приглашения. Участник уже добавлен в семью и может войти через Carelink Workspace.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Пароль человека не меняется. Ему нужно войти в Carelink и принять приглашение в течение 7
          дней.
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href={`/families/${familyId}/invites`}>К приглашениям</Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1">
          <Link href={`/families/${familyId}/invites/new`}>Пригласить ещё</Link>
        </Button>
      </div>
    </div>
  );
}
