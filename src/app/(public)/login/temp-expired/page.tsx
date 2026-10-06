import Link from 'next/link';
import { Clock } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TempPasswordExpiredPage() {
  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-error-muted text-destructive">
          <Clock className="size-6" aria-hidden />
        </div>
        <CardTitle>Срок временного пароля истёк</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">
          Временный пароль из письма-приглашения действует 72 часа и больше не подходит.
        </p>
        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Что делать
          </p>
          <ol className="list-decimal space-y-2 pl-4">
            <li>Попросите хранителя семьи отправить приглашение заново.</li>
            <li>Новый временный пароль придёт на вашу личную почту.</li>
            <li>Войдите и сразу задайте свой постоянный пароль.</li>
          </ol>
        </div>
        <p className="rounded-lg border border-border/60 bg-accent/40 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Хранитель</strong> — участник, который создал семью в
          Carelink и пригласил вас.
        </p>
        <Link href="/login" className={cn(buttonVariants(), 'w-full')}>
          Вернуться ко входу
        </Link>
        <p className="text-center font-mono text-xs text-muted-foreground">
          Код: TEMP_PASSWORD_EXPIRED
        </p>
      </CardContent>
    </Card>
  );
}
