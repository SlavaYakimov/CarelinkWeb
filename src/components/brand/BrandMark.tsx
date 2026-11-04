import * as React from 'react';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

export type BrandMarkProps = {
  className?: string;
  compact?: boolean;
};

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground',
          compact ? 'size-9' : 'size-10',
        )}
      >
        <Logo className={compact ? 'size-5' : 'size-6'} alt="" aria-hidden />
      </div>
      <div>
        <p
          className={cn(
            'font-heading font-semibold leading-tight text-primary',
            compact ? 'text-base' : 'text-lg',
          )}
        >
          Carelink
        </p>
        <p className="text-xs font-medium uppercase tracking-wider text-secondary">
          Спокойная забота
        </p>
      </div>
    </div>
  );
}
