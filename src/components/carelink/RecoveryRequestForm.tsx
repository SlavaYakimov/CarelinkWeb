'use client';

import * as React from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { recoveryRequestAction, type RecoveryRequestFormState } from '@/server/actions/recovery';
import { recoveryRequestClientSchema } from '@/lib/forms/schemas';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { usePhoneField } from '@/components/carelink/use-phone-field';
import { WorkspaceSlugField } from '@/components/carelink/WorkspaceSlugField';
import { FormAlert } from '@/components/carelink/FormAlert';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { useFocusFirstError } from '@/components/carelink/use-focus-first-error';

const initial: RecoveryRequestFormState = {};

export function RecoveryRequestForm() {
  const [state, formAction, pending] = useActionState(recoveryRequestAction, initial);
  const phoneField = usePhoneField('+7');
  const [familySlug, setFamilySlug] = React.useState('');

  const gate = useFormGate(
    recoveryRequestClientSchema,
    { familySlug, phone: phoneField.submitValue },
    ['familySlug', 'phone'],
    { pending },
  );

  useFocusFirstError(state.fieldErrors, state.formError);

  return (
    <form action={formAction} className="space-y-4">
      {state.formError ? <FormAlert message={state.formError} /> : null}

      <WorkspaceSlugField
        id="familySlug"
        name="familySlug"
        label="Адрес семьи (латиница)"
        value={familySlug}
        onChange={setFamilySlug}
        error={state.fieldErrors?.familySlug}
        disabled={pending}
        required
      />

      <PhoneInput
        value={phoneField.display}
        onChange={phoneField.onChange}
        error={state.fieldErrors?.phone}
        disabled={pending}
      />
      <input type="hidden" name="phone" value={phoneField.e164} />

      <SubmitButton type="submit" className="w-full" pending={pending} disabled={!gate.canSubmit}>
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
