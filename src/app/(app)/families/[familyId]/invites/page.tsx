import { redirect } from 'next/navigation';
import { FamilyInvitesList } from '@/components/carelink/FamilyInvitesList';
import { fetchFamilyInvites, isFamilyKeeper } from '@/server/data/family-invites';
import { getSession } from '@/server/session/get-session';

type PageProps = { params: Promise<{ familyId: string }> };

export default async function FamilyInvitesPage({ params }: PageProps) {
  const { familyId } = await params;
  const sessionCtx = await getSession();
  if (!sessionCtx) redirect('/session-ended');
  if (!sessionCtx.session.families[familyId]) redirect('/families');

  const [invites, isKeeper] = await Promise.all([
    fetchFamilyInvites(familyId),
    isFamilyKeeper(familyId),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Приглашения семьи</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Статусы исходящих приглашений и действия хранителя.
        </p>
      </div>
      {invites === null ? (
        <p className="text-sm text-muted-foreground">Не удалось загрузить список.</p>
      ) : (
        <FamilyInvitesList familyId={familyId} invites={invites} isKeeper={isKeeper} />
      )}
    </div>
  );
}
