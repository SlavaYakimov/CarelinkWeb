import { redirect } from 'next/navigation';
import { JoinEmailVerifyForm } from '@/components/carelink/join/JoinEmailVerifyForm';
import { requireJoinFlow } from '@/server/flows/join-flow';

export default async function JoinEmailVerifyPage() {
  const { flow } = await requireJoinFlow('verify');
  const email = flow.personalEmail;
  if (!email) redirect('/join/email');
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <JoinEmailVerifyForm email={email} />
    </div>
  );
}
