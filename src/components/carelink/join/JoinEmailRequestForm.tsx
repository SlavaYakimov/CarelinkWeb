'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { joinEmailFormSchema } from '@/lib/forms/schemas';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { joinEmailRequestAction, type JoinEmailState } from '@/server/actions/join';
import { StepShell } from '@/components/carelink/StepShell';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { FormAlert } from '@/components/carelink/FormAlert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: JoinEmailState = {};

export function JoinEmailRequestForm() {
  const [state, formAction, pending] = useActionState(joinEmailRequestAction, initial);
  const [email, setEmail] = React.useState('');
  const gate = useFormGate(joinEmailFormSchema, { email }, ['email'], { pending });

  return (
    <StepShell
      step={1}
      totalSteps={2}
      title="Почта для входа"
      description="Отправим 6-значный код. Он действует 15 минут."
    >
      <form action={formAction} className="space-y-4">
        {state.error ? <FormAlert message={state.error} /> : null}
        <div className="space-y-2">
          <Label htmlFor="join-email">Электронная почта</Label>
          <Input
            id="join-email"
            name="email"
            type="email"
            autoComplete="email"
            className="text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            required
          />
        </div>
        <SubmitButton type="submit" pending={pending} disabled={!gate.canSubmit} className="w-full">
          Получить код
        </SubmitButton>
      </form>
    </StepShell>
  );
}
