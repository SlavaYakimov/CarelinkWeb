'use client';

import Link from 'next/link';
import { StepShell } from '@/components/carelink/StepShell';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type JoinPendingPanelProps = {
  keeperDisplayName: string;
};

export function JoinPendingPanel({ keeperDisplayName }: JoinPendingPanelProps) {
  return (
    <StepShell
      step={1}
      totalSteps={1}
      title="Ждём хранителя"
      description={`Ждём подтверждения от ${keeperDisplayName}. Мы уведомим, когда заявку рассмотрят.`}
    >
      <div className="rounded-lg border border-border/70 bg-accent/40 p-4 text-sm text-accent-foreground">
        Пока хранитель не одобрит заявку, доступ к семье закрыт. Телефон сохранён для входа после
        подтверждения.
      </div>
      <Link href="/help" className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}>
        Нужна помощь
      </Link>
    </StepShell>
  );
}
