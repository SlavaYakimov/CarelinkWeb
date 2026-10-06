import Link from 'next/link';
import { ErrorScreen } from '@/components/carelink/ErrorScreen';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ForbiddenPage() {
  return (
    <div className="space-y-4">
      <ErrorScreen
        title="Недостаточно прав"
        description="Это действие доступно только хранителю семьи. Войдите под учётной записью хранителя или обратитесь к нему."
        code="FORBIDDEN"
      />
      <div className="mx-auto flex max-w-[440px] justify-center gap-3">
        <Link href="/login" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Войти
        </Link>
        <Link href="/families" className={cn(buttonVariants({ variant: 'ghost' }))}>
          Мои семьи
        </Link>
      </div>
    </div>
  );
}
