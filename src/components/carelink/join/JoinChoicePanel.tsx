'use client';

import { useActionState } from 'react';
import { QrCode, Users } from 'lucide-react';
import {
  joinChooseCreateFamilyAction,
  joinChooseScanQrAction,
  type JoinKeeperActionState,
} from '@/server/actions/join';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { StepShell } from '@/components/carelink/StepShell';

export type JoinChoicePanelProps = {
  email: string;
};

export function JoinChoicePanel({ email }: JoinChoicePanelProps) {
  const [, scanAction, scanPending] = useActionState(
    joinChooseScanQrAction,
    {} as JoinKeeperActionState,
  );
  const [, createAction, createPending] = useActionState(
    joinChooseCreateFamilyAction,
    {} as JoinKeeperActionState,
  );

  return (
    <StepShell
      step={1}
      totalSteps={1}
      title="Почта подтверждена"
      description={`Аккаунт для ${email} готов. Выберите, как продолжить.`}
    >
      <div className="space-y-3">
        <form action={scanAction}>
          <Card className="border-border/80 shadow-[var(--shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="size-5 text-primary" aria-hidden />
                Сканировать QR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Есть приглашение от хранителя семьи — откройте камеру или вставьте ссылку.</p>
              <SubmitButton type="submit" pending={scanPending} className="w-full">
                Перейти к QR
              </SubmitButton>
            </CardContent>
          </Card>
        </form>
        <form action={createAction}>
          <Card className="border-border/80 shadow-[var(--shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="size-5 text-primary" aria-hidden />
                Создать семью
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Мы создадим аккаунт семьи, вы станете хранителем.</p>
              <SubmitButton
                type="submit"
                variant="secondary"
                pending={createPending}
                className="w-full"
              >
                Создать семью
              </SubmitButton>
            </CardContent>
          </Card>
        </form>
      </div>
    </StepShell>
  );
}
