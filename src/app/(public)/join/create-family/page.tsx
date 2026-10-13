import { requireJoinFlow } from '@/server/flows/join-flow';
import { JoinCreateFamilyForm } from '@/components/carelink/join/JoinCreateFamilyForm';

export default async function JoinCreateFamilyPage() {
  await requireJoinFlow('create-family');
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <JoinCreateFamilyForm />
    </div>
  );
}
