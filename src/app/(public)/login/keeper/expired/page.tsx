import Link from 'next/link';
import { ErrorScreen } from '@/components/carelink/ErrorScreen';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function KeeperExpiredPage() {
  return (
    <div className="space-y-4">
      <ErrorScreen
        title="Время ожидания истекло"
        description="Запрос на подтверждение больше не действует. Начните вход заново."
        code="RECOVERY_GONE"
      />
      <div className="mx-auto flex max-w-[440px] justify-center">
        <Link href="/login" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Ко входу
        </Link>
      </div>
    </div>
  );
}
