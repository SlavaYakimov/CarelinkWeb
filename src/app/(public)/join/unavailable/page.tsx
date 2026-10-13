import Link from 'next/link';
import { ErrorScreen } from '@/components/carelink/ErrorScreen';
import { buttonVariants } from '@/components/ui/button';
import { joinUnavailableCopy, parseJoinUnavailableReason } from '@/lib/join/unavailable-reason';
import { cn } from '@/lib/utils';

type PageProps = { searchParams: Promise<{ reason?: string }> };

export default async function JoinUnavailablePage({ searchParams }: PageProps) {
  const { reason: raw } = await searchParams;
  const reason = parseJoinUnavailableReason(raw);
  const copy = joinUnavailableCopy(reason);

  return (
    <div className="space-y-4 px-4 py-12">
      <ErrorScreen title={copy.title} description={copy.description} code={reason.toUpperCase()} />
      <div className="mx-auto flex max-w-[440px] justify-center gap-3">
        <Link href="/help" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Поддержка
        </Link>
        <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }))}>
          Войти
        </Link>
      </div>
    </div>
  );
}
