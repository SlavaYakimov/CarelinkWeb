import { redirect } from 'next/navigation';
import { InviteSentPanel } from '@/components/carelink/InviteSentPanel';
import { requireCanManageInvites } from '@/server/data/family-invites';
import { getSession } from '@/server/session/get-session';

type PageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ kind?: string }>;
};

export default async function InviteSentPage({ params, searchParams }: PageProps) {
  const { familyId } = await params;
  const { kind } = await searchParams;
  const sessionCtx = await getSession();
  if (!sessionCtx) redirect('/session-ended');
  if (!sessionCtx.session.families[familyId]) redirect('/families');
  await requireCanManageInvites(familyId);

  const resolvedKind = kind === 'existing' ? 'existing' : 'new';

  return (
    <div className="px-6 py-8">
      <InviteSentPanel familyId={familyId} kind={resolvedKind} />
    </div>
  );
}
