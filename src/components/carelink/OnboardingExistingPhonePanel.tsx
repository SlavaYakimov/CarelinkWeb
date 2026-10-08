'use client';

import { ArrowRight } from 'lucide-react';
import {
  continueOnboardingAsNewFamilyAction,
  leaveOnboardingToLoginAction,
} from '@/server/actions/onboarding';
import { StepShell } from '@/components/carelink/StepShell';
import { Button } from '@/components/ui/button';
import { formatWorkspaceLogin } from '@/lib/workspace-slug';

export type OnboardingExistingWorkspace = {
  workspaceSlug: string;
  displayName: string;
};

export type OnboardingExistingPhonePanelProps = {
  phoneMasked?: string;
  workspaces?: OnboardingExistingWorkspace[];
};

export function OnboardingExistingPhonePanel({
  phoneMasked,
  workspaces = [],
}: OnboardingExistingPhonePanelProps) {
  const phoneLabel = phoneMasked ? `Номер ${phoneMasked}` : 'Этот номер';
  const hasWorkspaces = workspaces.length > 0;

  return (
    <StepShell
      step={2}
      totalSteps={5}
      title="Этот номер уже есть в Carelink"
      description={
        hasWorkspaces
          ? `${phoneLabel} уже привязан к вашему аккаунту. Войдите в свою семью или создайте ещё одну.`
          : `${phoneLabel} уже привязан к вашему аккаунту. Создайте ещё одну семью или войдите в свою.`
      }
    >
      <div className="space-y-3">
        {hasWorkspaces ? (
          <ul className="space-y-2" aria-label="Ваши семьи">
            {workspaces.map((ws) => (
              <li key={ws.workspaceSlug}>
                <form
                  action={leaveOnboardingToLoginAction}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <input type="hidden" name="workspaceSlug" value={ws.workspaceSlug} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ws.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatWorkspaceLogin(ws.workspaceSlug)}
                    </p>
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    aria-label={`Войти в семью ${ws.displayName}`}
                  >
                    Войти
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
        <form action={continueOnboardingAsNewFamilyAction} className="space-y-2">
          <Button type="submit" className="w-full">
            Создать новую семью
            <ArrowRight className="size-4" aria-hidden />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Подтвердим устройство и зададим пароль для новой семьи
          </p>
        </form>
        <form action={leaveOnboardingToLoginAction}>
          <Button type="submit" variant={hasWorkspaces ? 'ghost' : 'secondary'} className="w-full">
            {hasWorkspaces ? 'Войти в другую семью' : 'Войти в свою семью'}
          </Button>
        </form>
      </div>
    </StepShell>
  );
}
