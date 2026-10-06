'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import {
  completeSignInAfterDelegateAction,
  requestKeeperDelegatePushAction,
} from '@/server/actions/keeper-wait';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type KeeperWaitPanelProps = {
  workspaceEmail?: string;
  nextPath: string;
  pushAlreadySent?: boolean;
};

type PollBody =
  | { status: 'pending'; nextPollMs: number }
  | { status: 'approved' }
  | { status: 'rejected' }
  | { status: 'expired' }
  | { status: 'rate_limit'; retryAfter?: number };

export function KeeperWaitPanel({
  workspaceEmail,
  nextPath,
  pushAlreadySent = false,
}: KeeperWaitPanelProps) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<'starting' | 'waiting' | 'completing' | 'failed'>(
    pushAlreadySent ? 'waiting' : 'starting',
  );
  const [error, setError] = React.useState<string | null>(null);
  const attemptRef = React.useRef(0);

  React.useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function ensurePush() {
      if (pushAlreadySent) return true;
      const res = await requestKeeperDelegatePushAction();
      if ('error' in res) {
        setError('Не удалось отправить запрос хранителю.');
        setPhase('failed');
        return false;
      }
      return true;
    }

    async function poll() {
      const res = await fetch(`/api/auth/sign-in/delegate-status?attempt=${attemptRef.current}`, {
        cache: 'no-store',
      });
      if (res.status === 429) {
        const body = (await res.json()) as PollBody;
        const retry =
          'retryAfter' in body && typeof body.retryAfter === 'number' ? body.retryAfter : 60;
        router.replace(`/login/too-many?retryAfter=${retry}`);
        return;
      }
      if (!res.ok) {
        setError('Не удалось проверить статус. Попробуйте обновить страницу.');
        setPhase('failed');
        return;
      }
      const body = (await res.json()) as PollBody;
      if (body.status === 'approved') {
        setPhase('completing');
        await completeSignInAfterDelegateAction(nextPath);
        return;
      }
      if (body.status === 'rejected') {
        router.replace('/login/keeper/rejected');
        return;
      }
      if (body.status === 'expired') {
        router.replace('/login/keeper/expired');
        return;
      }
      attemptRef.current += 1;
      const delay = 'nextPollMs' in body && body.nextPollMs ? body.nextPollMs : 3000;
      timer = window.setTimeout(poll, delay);
    }

    (async () => {
      if (cancelled) return;
      const ok = await ensurePush();
      if (!ok || cancelled) return;
      setPhase('waiting');
      await poll();
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [nextPath, pushAlreadySent, router]);

  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {phase === 'completing' ? (
            <Loader2 className="size-6 animate-spin" aria-hidden />
          ) : (
            <ShieldCheck className="size-6" aria-hidden />
          )}
        </div>
        <CardTitle className="text-2xl">Ждём подтверждения хранителя</CardTitle>
        <CardDescription>
          {workspaceEmail
            ? `Запрос отправлен хранителю семьи для входа ${workspaceEmail}.`
            : 'Хранитель семьи должен подтвердить вход с этого устройства в приложении или на сайте.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
        {phase === 'waiting' || phase === 'starting' ? (
          <p className="flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Ожидаем ответ…
          </p>
        ) : null}
        {phase === 'completing' ? <p>Завершаем вход…</p> : null}
        {error ? (
          <p className="text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {phase === 'failed' ? (
          <Button type="button" variant="secondary" onClick={() => router.push('/login')}>
            Вернуться ко входу
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
