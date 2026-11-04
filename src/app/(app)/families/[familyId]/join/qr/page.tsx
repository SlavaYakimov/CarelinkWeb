import { redirect } from 'next/navigation';
import { KeeperJoinQrPanel } from '@/components/carelink/join/KeeperJoinQrPanel';
import { fetchFamilyJoinLink } from '@/server/data/family-join';

type PageProps = { params: Promise<{ familyId: string }> };

export default async function FamilyJoinQrPage({ params }: PageProps) {
  const { familyId } = await params;
  const link = await fetchFamilyJoinLink(familyId);
  if (!link) redirect('/forbidden');
  return (
    <div className="px-6 py-10">
      <KeeperJoinQrPanel familyId={familyId} initialLink={link} />
    </div>
  );
}
