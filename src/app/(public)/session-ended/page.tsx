import Link from 'next/link';
import { Lock } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SessionEndedPage() {
  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-error-muted text-destructive">
          <Lock className="size-6" aria-hidden />
        </div>
        <CardTitle>Сессия завершена</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">
          Время входа истекло или сессия была отозвана (например, выход на всех устройствах).
          Войдите снова.
        </p>
        <Link href="/login" className={cn(buttonVariants(), 'w-full')}>
          Войти снова
        </Link>
        <Link href="/login" className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}>
          Восстановить доступ через семью
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Системный код ошибки:{' '}
          <span className="rounded bg-muted px-2 py-0.5 font-mono">REF-40-SESSION</span>
        </p>
      </CardContent>
    </Card>
  );
}
