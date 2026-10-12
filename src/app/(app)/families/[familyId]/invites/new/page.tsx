import { redirect } from 'next/navigation';
import { InviteMemberForm } from '@/components/carelink/InviteMemberForm';
import { fetchFamilyRoleTemplates } from '@/server/data/family-invites';
import { getSession } from '@/server/session/get-session';

type PageProps = { params: Promise<{ familyId: string }> };

export default async function InviteMemberNewPage({ params }: PageProps) {
  const { familyId } = await params;
  const sessionCtx = await getSession();
  if (!sessionCtx) redirect('/session-ended');
  if (!sessionCtx.session.families[familyId]) redirect('/families');

  const roles = await fetchFamilyRoleTemplates(familyId);
  if (!roles || roles.length === 0) {
    return (
      <div className="px-6 py-8">
        <p className="text-sm text-muted-foreground">
          Не удалось загрузить роли или у вас нет прав хранителя.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <InviteMemberForm familyId={familyId} roleTemplates={roles} />
    </div>
  );
}
