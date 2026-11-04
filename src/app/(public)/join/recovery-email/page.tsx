import Link from 'next/link';
import { JoinEmailRequestForm } from '@/components/carelink/join/JoinEmailRequestForm';
import { requireJoinFlow } from '@/server/flows/join-flow';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default async function JoinRecoveryEmailPage() {
  await requireJoinFlow('pending');
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-12">
      <JoinEmailRequestForm />
      <Link
        href="/join/pending"
        className={cn(buttonVariants({ variant: 'ghost' }), 'max-w-[440px]')}
      >
        Позже
      </Link>
    </div>
  );
}
