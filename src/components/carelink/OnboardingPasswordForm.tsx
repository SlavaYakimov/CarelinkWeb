'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  setupOnboardingPasswordAction,
  type OnboardingPasswordState,
} from '@/server/actions/onboarding';
import { PasswordField } from '@/components/carelink/PasswordField';
import { StepShell } from '@/components/carelink/StepShell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const initial: OnboardingPasswordState = {};

export function OnboardingPasswordForm() {
  const [state, formAction, pending] = useActionState(setupOnboardingPasswordAction, initial);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  return (
    <StepShell
      step={4}
      totalSteps={5}
      title="Пароль семьи"
      description="Этот пароль вы будете использовать вместе с workspace-логином семьи."
    >
      <form action={formAction} className="space-y-4">
        {state.formError ? (
          <Alert variant="destructive">
            <AlertDescription>{state.formError}</AlertDescription>
          </Alert>
        ) : null}
        <PasswordField
          id="newPassword"
          label="Новый пароль"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          error={state.fieldErrors?.newPassword}
          disabled={pending}
        />
        <input type="hidden" name="newPassword" value={newPassword} />
        <PasswordField
          id="confirmPassword"
          label="Повторите пароль"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          error={state.fieldErrors?.confirmPassword}
          disabled={pending}
          showRequirements={false}
        />
        <input type="hidden" name="confirmPassword" value={confirmPassword} />
        <Button type="submit" className="w-full" disabled={pending}>
          Сохранить пароль
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>
    </StepShell>
  );
}
