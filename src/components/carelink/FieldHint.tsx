'use client';

import { cn } from '@/lib/utils';

export type FieldHintProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

export function FieldHint({ id, children, className }: FieldHintProps) {
  return (
    <p id={id} className={cn('text-xs text-muted-foreground', className)}>
      {children}
    </p>
  );
}
