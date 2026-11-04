import { redirect } from 'next/navigation';
import { JoinEmailTakenPanel } from '@/components/carelink/join/JoinEmailTakenPanel';
import { requireJoinFlow } from '@/server/flows/join-flow';

export default async function JoinEmailTakenPage() {
  const { flow } = await requireJoinFlow('taken');
  if (!flow.personalEmail) redirect('/join/email');
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <JoinEmailTakenPanel email={flow.personalEmail} />
    </div>
  );
}
