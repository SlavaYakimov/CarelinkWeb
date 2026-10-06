import Link from 'next/link';
import { ErrorScreen } from '@/components/carelink/ErrorScreen';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function KeeperRejectedPage() {
  return (
    <div className="space-y-4">
      <ErrorScreen
        title="Хранитель отклонил вход"
        description="Попросите хранителя семьи подтвердить вход или войдите с подтверждением по SMS, если номер уже привязан."
        code="FORBIDDEN"
      />
      <div className="mx-auto flex max-w-[440px] justify-center">
        <Link href="/login" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Ко входу
        </Link>
      </div>
    </div>
  );
}
