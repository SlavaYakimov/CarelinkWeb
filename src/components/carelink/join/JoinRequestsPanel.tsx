'use client';

import { useActionState } from 'react';
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
  type JoinKeeperActionState,
} from '@/server/actions/join';
import type { components } from '@/server/gateway/types.gen';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { FormAlert } from '@/components/carelink/FormAlert';
import { cn } from '@/lib/utils';

type JoinRequestView = components['schemas']['JoinRequestView'];

const keeperInitial: JoinKeeperActionState = {};

export type JoinRequestsPanelProps = {
  familyId: string;
  items: JoinRequestView[];
};

function formatScannedAt(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

export function JoinRequestsPanel({ familyId, items }: JoinRequestsPanelProps) {
  const [approveState, approveAction, approving] = useActionState(
    approveJoinRequestAction,
    keeperInitial,
  );
  const [rejectState, rejectAction, rejecting] = useActionState(
    rejectJoinRequestAction,
    keeperInitial,
  );

  return (
    <div className="mx-auto w-full max-w-[640px] space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Заявки на вступление</h1>
        <p className="text-sm text-muted-foreground">Имя и время скана — без лишних данных.</p>
      </div>

      {approveState.error || rejectState.error ? (
        <FormAlert message={approveState.error ?? rejectState.error ?? ''} />
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-lg border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
          Пока нет заявок. Обновите QR и попросите родственника отсканировать код.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.requestId}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-base font-medium text-foreground">{item.displayName}</p>
                <p className="text-sm text-muted-foreground">{formatScannedAt(item.scannedAt)}</p>
              </div>
              <div className="flex gap-2">
                <form action={approveAction}>
                  <input type="hidden" name="requestId" value={item.requestId} />
                  <input type="hidden" name="familyId" value={familyId} />
                  <SubmitButton
                    type="submit"
                    size="sm"
                    pending={approving}
                    className={cn('min-h-11 focus-visible:ring-[3px] focus-visible:ring-ring')}
                  >
                    Принять
                  </SubmitButton>
                </form>
                <form action={rejectAction}>
                  <input type="hidden" name="requestId" value={item.requestId} />
                  <input type="hidden" name="familyId" value={familyId} />
                  <SubmitButton
                    type="submit"
                    size="sm"
                    variant="secondary"
                    pending={rejecting}
                    className={cn('min-h-11 focus-visible:ring-[3px] focus-visible:ring-ring')}
                  >
                    Отклонить
                  </SubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
