'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  pending?: boolean;
  pendingLabel?: string;
};

export function SubmitButton({
  pending,
  pendingLabel = '…',
  disabled,
  children,
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(className)}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {children}
      </span>
      {pending ? <span className="sr-only">{pendingLabel}</span> : null}
    </Button>
  );
}
