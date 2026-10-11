'use client';

import * as React from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { recoveryRequestAction, type RecoveryRequestFormState } from '@/server/actions/recovery';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { WorkspaceSlugField } from '@/components/carelink/WorkspaceSlugField';
import { FormAlert } from '@/components/carelink/FormAlert';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { useFocusFirstError } from '@/components/carelink/use-focus-first-error';

const initial: RecoveryRequestFormState = {};

export function RecoveryRequestForm() {
  const [state, formAction, pending] = useActionState(recoveryRequestAction, initial);
  const [phone, setPhone] = React.useState('+7');

  useFocusFirstError(state.fieldErrors, state.formError);

  return (
    <form action={formAction} className="space-y-4">
      {state.formError ? <FormAlert message={state.formError} /> : null}

      <WorkspaceSlugField
        id="familySlug"
        name="familySlug"
        label="Адрес семьи (латиница)"
        error={state.fieldErrors?.familySlug}
        disabled={pending}
        required
      />

      <input type="hidden" name="phone" value={phone} />
      <PhoneInput
        value={phone}
        onChange={(display) => setPhone(display)}
        error={state.fieldErrors?.phone}
        disabled={pending}
      />

      <SubmitButton type="submit" className="w-full" pending={pending}>
        Отправить запрос хранителю
      </SubmitButton>

      <p className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Вернуться ко входу
        </Link>
      </p>
    </form>
  );
}
