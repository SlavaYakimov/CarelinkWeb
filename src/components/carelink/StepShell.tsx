'use client';

import * as React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type StepShellProps = {
  title: string;
  description?: string;
  step: number;
  totalSteps: number;
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
};

export function StepShell({
  title,
  description,
  step,
  totalSteps,
  onBack,
  children,
  className,
}: StepShellProps) {
  const pct = Math.min(100, Math.max(0, Math.round((step / totalSteps) * 100)));

  return (
    <div className={cn('mx-auto w-full max-w-[440px] space-y-6', className)}>
      <div className="space-y-3">
        {onBack ? (
          <Button type="button" variant="ghost" size="sm" className="-ml-2 px-2" onClick={onBack}>
            <ChevronLeft className="size-4" />
            Назад
          </Button>
        ) : null}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Шаг {step} из {totalSteps}
            </span>
            <span>{pct}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}
