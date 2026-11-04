'use client';

import type * as React from 'react';
import { cn } from '@/lib/utils';

export type FieldErrorProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

export function FieldError({ id, children, className }: FieldErrorProps) {
  return (
    <p
      id={id}
      className={cn('text-sm text-destructive', className)}
      role="alert"
      aria-live="polite"
    >
      {children}
    </p>
  );
}
