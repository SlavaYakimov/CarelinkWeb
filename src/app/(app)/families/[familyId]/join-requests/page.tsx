import { redirect } from 'next/navigation';
import { JoinRequestsPanel } from '@/components/carelink/join/JoinRequestsPanel';
import { fetchFamilyJoinRequests } from '@/server/data/family-join';

type PageProps = { params: Promise<{ familyId: string }> };

export default async function FamilyJoinRequestsPage({ params }: PageProps) {
  const { familyId } = await params;
  const items = await fetchFamilyJoinRequests(familyId);
  if (items === null) redirect('/forbidden');
  return (
    <div className="px-6 py-10">
      <JoinRequestsPanel familyId={familyId} items={items} />
    </div>
  );
}
