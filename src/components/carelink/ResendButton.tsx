'use client';

import * as React from 'react';
import { useResendCountdown } from '@/components/carelink/use-resend-countdown';
import { cn } from '@/lib/utils';

export type ResendButtonProps = {
  action: (payload: FormData) => void;
  pending: boolean;
  successAt?: string | null;
  startOnMount?: boolean;
  cooldownSeconds?: number;
  retryAfter?: number;
  error?: string;
  onResendSuccess?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function ResendButton({
  action,
  pending,
  successAt,
  startOnMount = false,
  cooldownSeconds = 60,
  retryAfter,
  error,
  onResendSuccess,
  className,
  children = 'Отправить код повторно',
}: ResendButtonProps) {
  const countdown = useResendCountdown({
    successAt,
    startOnMount,
    seconds: cooldownSeconds,
  });

  const { applyRetryAfter, secondsLeft, label } = countdown;

  React.useEffect(() => {
    if (retryAfter != null && retryAfter > 0) {
      applyRetryAfter(retryAfter);
    }
  }, [retryAfter, applyRetryAfter]);

  const canResend = secondsLeft === 0 && !pending;

  return (
    <div className={cn('text-center text-sm', className)}>
      {secondsLeft > 0 ? (
        <span className="text-muted-foreground">Отправить код повторно через {label}</span>
      ) : (
        <form
          action={action}
          onSubmit={() => {
            onResendSuccess?.();
          }}
        >
          <button
            type="submit"
            className="text-primary underline-offset-2 hover:underline disabled:opacity-50"
            disabled={!canResend}
          >
            {pending ? 'Отправляем…' : children}
          </button>
        </form>
      )}
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
