'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { joinEmailRedeemExistingAction, type JoinKeeperActionState } from '@/server/actions/join';
import { StepShell } from '@/components/carelink/StepShell';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type JoinEmailTakenPanelProps = {
  email: string;
};

export function JoinEmailTakenPanel({ email }: JoinEmailTakenPanelProps) {
  const [, redeemAction, pending] = useActionState(
    joinEmailRedeemExistingAction,
    {} as JoinKeeperActionState,
  );

  return (
    <StepShell
      step={1}
      totalSteps={1}
      title="Почта уже в аккаунте"
      description={`Для ${email} уже есть профиль Carelink.`}
    >
      <div className="space-y-3">
        <form action={redeemAction}>
          <SubmitButton type="submit" pending={pending} className="w-full">
            Войти как {email}
          </SubmitButton>
        </form>
        <Link href="/join/email" className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}>
          Указать другую почту
        </Link>
      </div>
    </StepShell>
  );
}
