'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  setupOnboardingPasswordAction,
  type OnboardingPasswordState,
} from '@/server/actions/onboarding';
import { passwordPairFormSchema } from '@/lib/forms/schemas';
import { mergeFieldError } from '@/lib/forms/client-field-error';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { PasswordField } from '@/components/carelink/PasswordField';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { StepShell } from '@/components/carelink/StepShell';
import { Alert, AlertDescription } from '@/components/ui/alert';

const initial: OnboardingPasswordState = {};

export function OnboardingPasswordForm() {
  const [state, formAction, pending] = useActionState(setupOnboardingPasswordAction, initial);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [confirmTouched, setConfirmTouched] = React.useState(false);

  const gate = useFormGate(
    passwordPairFormSchema,
    { newPassword, confirmPassword },
    ['newPassword', 'confirmPassword'],
    { pending },
  );

  return (
    <StepShell
      step={4}
      totalSteps={5}
      title="Пароль семьи"
      description="Этот пароль вы будете использовать вместе с логином семьи для входа."
    >
      <form action={formAction} className="space-y-4" onSubmit={() => gate.touchAll()}>
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
          error={mergeFieldError(gate, 'newPassword', state.fieldErrors?.newPassword)}
          disabled={pending}
          onBlur={() => gate.touch('newPassword')}
        />
        <input type="hidden" name="newPassword" value={newPassword} />
        <PasswordField
          id="confirmPassword"
          label="Повторите пароль"
          value={confirmPassword}
          onChange={(v) => {
            setConfirmPassword(v);
            setConfirmTouched(true);
          }}
          autoComplete="new-password"
          error={
            mergeFieldError(gate, 'confirmPassword', state.fieldErrors?.confirmPassword) ??
            (confirmTouched && newPassword !== confirmPassword ? 'Пароли не совпадают' : undefined)
          }
          disabled={pending}
          showRequirements={false}
          onBlur={() => gate.touch('confirmPassword')}
        />
        <input type="hidden" name="confirmPassword" value={confirmPassword} />
        <SubmitButton type="submit" className="w-full" pending={pending} disabled={!gate.canSubmit}>
          Сохранить пароль
          <ArrowRight className="size-4" aria-hidden />
        </SubmitButton>
      </form>
    </StepShell>
  );
}
