import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MemberLabelsPanel } from '@/components/carelink/member-labels/MemberLabelsPanel';
import { fetchFamilyMembers } from '@/server/data/family-members';
import { fetchMemberLabels } from '@/server/data/member-labels';
import { getSession } from '@/server/session/get-session';

export const metadata: Metadata = {
  title: 'Участники семьи',
};

type PageProps = { params: Promise<{ familyId: string }> };

export default async function FamilyMembersPage({ params }: PageProps) {
  const { familyId } = await params;
  const sessionCtx = await getSession();
  if (!sessionCtx) redirect('/session-ended');
  if (!sessionCtx.session.families[familyId]) redirect('/families');

  const [members, labels] = await Promise.all([
    fetchFamilyMembers(familyId),
    fetchMemberLabels(familyId),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <p className="text-sm">
          <Link href={`/families/${familyId}`} className="text-primary hover:underline">
            ← К семье
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Участники семьи</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Метки видны рядом с именем. До пяти активных меток на человека, до десяти получателей за
          раз.
        </p>
      </div>

      {members === null || labels === null ? (
        <p className="text-sm text-muted-foreground">
          Не удалось загрузить участников или метки. Проверьте, что backend доступен; для меток
          контракт может быть ещё в разработке (mock включается только в тестах).
        </p>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">В семье пока нет других участников.</p>
      ) : (
        <MemberLabelsPanel
          familyId={familyId}
          members={members}
          labels={labels}
          currentUserId={sessionCtx.session.userId}
        />
      )}
    </div>
  );
}
