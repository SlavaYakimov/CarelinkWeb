'use client';

import * as React from 'react';
import { AlertCircle, Hourglass, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/messages';
import { cn } from '@/lib/utils';

export type ErrorScreenProps = {
  code?: string;
  title?: string;
  description?: string;
  retryAfterSeconds?: number;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void };
  variant?: 'error' | 'rate-limit';
  className?: string;
};

export function ErrorScreen({
  code = 'UNKNOWN',
  title,
  description,
  retryAfterSeconds,
  primaryAction,
  secondaryAction,
  variant = 'error',
  className,
}: ErrorScreenProps) {
  const resolvedTitle =
    title ?? (variant === 'rate-limit' ? 'Слишком много попыток' : 'Не удалось выполнить действие');
  const resolvedDescription =
    description ??
    (variant === 'rate-limit'
      ? 'Для защиты вашей семьи мы временно ограничили вход с этого устройства.'
      : getErrorMessage(code));

  const Icon = variant === 'rate-limit' ? Hourglass : code === 'UNAUTHORIZED' ? Lock : AlertCircle;

  return (
    <Card className={cn('mx-auto w-full max-w-[440px]', className)}>
      <CardHeader className="items-center text-center">
        <div
          className={cn(
            'mb-2 flex size-12 items-center justify-center rounded-full',
            variant === 'rate-limit'
              ? 'bg-warning-muted text-warning'
              : 'bg-error-muted text-destructive',
          )}
        >
          <Icon className="size-6" aria-hidden />
        </div>
        <CardTitle>{resolvedTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">{resolvedDescription}</p>

        {variant === 'rate-limit' && retryAfterSeconds !== undefined ? (
          <Alert variant="warning" className="text-center">
            <AlertTitle>Повторить можно через</AlertTitle>
            <AlertDescription className="font-mono text-lg tabular-nums">
              {formatCountdown(retryAfterSeconds)}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2">
          {primaryAction ? (
            <Button
              type="button"
              className="w-full"
              disabled={primaryAction.disabled}
              onClick={primaryAction.onClick}
            >
              {primaryAction.disabled ? <Lock className="size-4" aria-hidden /> : null}
              {primaryAction.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>

        <p className="text-center font-mono text-xs text-muted-foreground">Код: {code}</p>
      </CardContent>
    </Card>
  );
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
}
