'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { joinEmailVerifyAction, type JoinEmailOtpState } from '@/server/actions/join';
import { OtpInput } from '@/components/carelink/OtpInput';
import { StepShell } from '@/components/carelink/StepShell';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { FormAlert } from '@/components/carelink/FormAlert';

const initial: JoinEmailOtpState = {};

export type JoinEmailVerifyFormProps = {
  email: string;
};

export function JoinEmailVerifyForm({ email }: JoinEmailVerifyFormProps) {
  const [state, formAction, pending] = useActionState(joinEmailVerifyAction, initial);
  const [code, setCode] = React.useState('');

  return (
    <StepShell
      step={2}
      totalSteps={2}
      title="Код из письма"
      description={`Мы отправили 6-значный код на ${email}`}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        {state.error ? <FormAlert message={state.error} /> : null}
        <OtpInput
          id="join-email-code"
          name="code"
          value={code}
          onChange={setCode}
          disabled={pending}
          error={state.fieldErrors?.code}
        />
        <SubmitButton
          type="submit"
          pending={pending}
          disabled={code.replace(/\D/g, '').length !== 6}
          className="w-full"
        >
          Подтвердить
        </SubmitButton>
      </form>
    </StepShell>
  );
}
