'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Check, X } from 'lucide-react';
import {
  approveDelegateAction,
  rejectDelegateAction,
  type DelegateApprovalState,
} from '@/server/actions/delegate-approval';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initial: DelegateApprovalState = {};

export type DelegateApprovalCardProps = {
  memberDisplayName: string;
  familyName: string;
  platform?: string;
  clientDeviceId: string;
  requestedAt: string;
  expiresAt: string;
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function platformLabel(platform?: string): string {
  if (!platform) return 'Не указана';
  if (platform === 'web') return 'Браузер (веб)';
  return platform;
}

export function DelegateApprovalCard(props: DelegateApprovalCardProps) {
  const [approveState, approve, approving] = useActionState(approveDelegateAction, initial);
  const [rejectState, reject, rejecting] = useActionState(rejectDelegateAction, initial);
  const busy = approving || rejecting;
  const done = approveState.done ?? rejectState.done;

  if (done === 'approved') {
    return (
      <Card className="mx-auto w-full max-w-[440px] shadow-card">
        <CardHeader>
          <CardTitle>Вход подтверждён</CardTitle>
          <CardDescription>Участник сможет продолжить вход на своём устройстве.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (done === 'rejected') {
    return (
      <Card className="mx-auto w-full max-w-[440px] shadow-card">
        <CardHeader>
          <CardTitle>Запрос отклонён</CardTitle>
          <CardDescription>
            Участник увидит отказ и сможет попробовать другой способ входа.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formError = approveState.formError ?? rejectState.formError;

  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader>
        <CardTitle className="text-2xl">Подтвердить вход участника</CardTitle>
        <CardDescription>
          Проверьте, что это ожидаемый вход в семью «{props.familyName}».
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Участник</dt>
            <dd className="font-medium text-right">{props.memberDisplayName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Платформа</dt>
            <dd className="font-medium text-right">{platformLabel(props.platform)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Устройство</dt>
            <dd className="font-mono text-xs text-right">{props.clientDeviceId}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Запрошено</dt>
            <dd className="text-right">{formatWhen(props.requestedAt)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Действует до</dt>
            <dd className="text-right">{formatWhen(props.expiresAt)}</dd>
          </div>
        </dl>

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <form action={reject}>
            <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
              <X className="size-4" aria-hidden />
              Отклонить
            </Button>
          </form>
          <form action={approve}>
            <Button type="submit" className="w-full" disabled={busy}>
              <Check className="size-4" aria-hidden />
              Подтвердить
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
