'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { saveInviteCodeAction, type InviteMutationState } from '@/server/actions/invites';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { Button } from '@/components/ui/button';

const initial: InviteMutationState = {};

export function PublicInviteLanding({ code }: { code: string }) {
  const [, formAction, pending] = useActionState(saveInviteCodeAction, initial);

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-xl border border-border bg-card p-8 shadow-card">
      <h1 className="text-2xl font-semibold tracking-tight">Вас пригласили в Carelink</h1>
      <p className="text-sm text-muted-foreground">
        Семья приглашает вас присоединиться. Войдите с workspace-логином и паролем из письма. Если
        вы уже пользовались Carelink — после входа откройте раздел «Приглашения» и примите
        приглашение.
      </p>
      <form action={formAction}>
        <input type="hidden" name="code" value={code} />
        <SubmitButton type="submit" className="w-full" pending={pending}>
          Войти
        </SubmitButton>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        Нет письма?{' '}
        <Link href="/login" className="text-primary underline-offset-2 hover:underline">
          Перейти ко входу
        </Link>
      </p>
    </div>
  );
}
