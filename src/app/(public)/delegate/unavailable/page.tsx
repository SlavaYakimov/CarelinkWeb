import Link from 'next/link';
import { ErrorScreen } from '@/components/carelink/ErrorScreen';
import { delegateUnavailableCopy, parseDelegateUnavailableReason } from '@/lib/delegate-errors';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function DelegateUnavailablePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const reason = parseDelegateUnavailableReason(params.reason);
  if (!reason) redirect('/delegate');

  const copy = delegateUnavailableCopy(reason);

  return (
    <div className="space-y-4">
      <ErrorScreen title={copy.title} description={copy.description} code="NOT_FOUND" />
      <div className="mx-auto flex max-w-[440px] justify-center gap-3">
        <Link href="/families" className={cn(buttonVariants({ variant: 'default' }))}>
          На главную
        </Link>
        <Link href="/login" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Войти
        </Link>
      </div>
    </div>
  );
}
