import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { readRecoveryFlow } from '@/server/flows/recovery-flow';
import { redirect } from 'next/navigation';

export default async function RecoverySentPage() {
  const ctx = await readRecoveryFlow();
  if (!ctx || ctx.flow.step !== 'sent') {
    redirect('/login/recovery');
  }

  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader>
        <CardTitle>Запрос отправлен</CardTitle>
        <CardDescription>
          Если хранитель одобрит восстановление, на ваш телефон придёт SMS с кодом и идентификатором
          запроса. Это может занять некоторое время.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/login/recovery/confirm" className={cn(buttonVariants(), 'w-full')}>
          У меня уже есть код
        </Link>
        <Link href="/login" className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}>
          На страницу входа
        </Link>
      </CardContent>
    </Card>
  );
}
