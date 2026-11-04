import Link from 'next/link';
import { ErrorScreen } from '@/components/carelink/ErrorScreen';
import { buttonVariants } from '@/components/ui/button';
import {
  inviteUnavailableCopy,
  parseInviteUnavailableReason,
} from '@/lib/invites/unavailable-reason';
import { cn } from '@/lib/utils';

type PageProps = { searchParams: Promise<{ reason?: string }> };

export default async function PublicInviteUnavailablePage({ searchParams }: PageProps) {
  const { reason: rawReason } = await searchParams;
  const reason = parseInviteUnavailableReason(rawReason);
  const copy = inviteUnavailableCopy(reason);

  return (
    <div className="space-y-4 px-4 py-12">
      <ErrorScreen title={copy.title} description={copy.description} code={reason.toUpperCase()} />
      <div className="mx-auto flex max-w-[440px] justify-center gap-3">
        <Link href="/login" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Войти
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: 'ghost' }))}>
          На главную
        </Link>
      </div>
    </div>
  );
}
