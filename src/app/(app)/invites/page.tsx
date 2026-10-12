import { redirect } from 'next/navigation';
import { IncomingInvitesPanel } from '@/components/carelink/IncomingInvitesPanel';
import { fetchPendingInvites } from '@/server/data/pending-invites';
import { getSession } from '@/server/session/get-session';

export const dynamic = 'force-dynamic';

export default async function IncomingInvitesPage() {
  const sessionCtx = await getSession();
  if (!sessionCtx) redirect('/session-ended');

  const invites = await fetchPendingInvites();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Входящие приглашения</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Примите или отклоните приглашения в другие семьи.
        </p>
      </div>
      {invites === null ? (
        <p className="text-sm text-muted-foreground">Не удалось загрузить приглашения.</p>
      ) : (
        <IncomingInvitesPanel invites={invites} />
      )}
    </div>
  );
}
