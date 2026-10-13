'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshKeeperJoinLinkAction } from '@/server/actions/join';
import type { components } from '@/server/gateway/types.gen';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type LinkResponse = components['schemas']['FamilyJoinLinkResponse'];

export type KeeperJoinQrPanelProps = {
  familyId: string;
  initialLink: LinkResponse;
};

export function KeeperJoinQrPanel({ familyId, initialLink }: KeeperJoinQrPanelProps) {
  const [link, setLink] = React.useState(initialLink);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const expiresLabel = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(link.expiresAt));

  async function onRefresh() {
    setPending(true);
    setError(null);
    try {
      const next = await refreshKeeperJoinLinkAction(familyId);
      setLink(next);
    } catch {
      setError('Не удалось обновить QR. Попробуйте позже.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[520px] space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">QR для вступления</h1>
        <p className="text-sm text-muted-foreground">
          Покажите код родственнику или отправьте ссылку. Действует до {expiresLabel}.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div
          className="flex size-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-center text-sm text-muted-foreground"
          aria-label="QR-код приглашения"
        >
          QR
          <span className="sr-only">{link.joinToken}</span>
        </div>
        <p className="font-mono text-lg tracking-widest text-foreground">{link.shortCode ?? '—'}</p>
        <p className="break-all text-sm text-muted-foreground">{link.shareUrl}</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          className={cn('min-h-11 flex-1 focus-visible:ring-[3px] focus-visible:ring-ring')}
          disabled={pending}
          onClick={() => void onRefresh()}
        >
          <RefreshCw className="mr-2 size-4" aria-hidden />
          Обновить
        </Button>
        <SubmitButton type="button" variant="ghost" className="flex-1" disabled>
          Отменить
        </SubmitButton>
      </div>
    </div>
  );
}
