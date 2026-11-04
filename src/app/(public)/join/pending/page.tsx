import { JoinPendingPanel } from '@/components/carelink/join/JoinPendingPanel';
import { requireJoinFlow } from '@/server/flows/join-flow';

export default async function JoinPendingPage() {
  const { flow } = await requireJoinFlow('pending');
  const keeper = flow.joinKeeperDisplayName ?? 'хранителя';
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <JoinPendingPanel keeperDisplayName={keeper} />
    </div>
  );
}
