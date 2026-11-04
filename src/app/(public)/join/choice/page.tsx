import { redirect } from 'next/navigation';
import { JoinChoicePanel } from '@/components/carelink/join/JoinChoicePanel';
import { requireJoinFlow } from '@/server/flows/join-flow';

export default async function JoinChoicePage() {
  const { flow } = await requireJoinFlow('choice');
  if (!flow.personalEmail) redirect('/join/email');
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <JoinChoicePanel email={flow.personalEmail} />
    </div>
  );
}
