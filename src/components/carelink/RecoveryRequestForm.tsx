'use client';

import * as React from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { recoveryRequestAction, type RecoveryRequestFormState } from '@/server/actions/recovery';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { WorkspaceSlugField } from '@/components/carelink/WorkspaceSlugField';
import { Button } from '@/components/ui/button';

const initial: RecoveryRequestFormState = {};

export function RecoveryRequestForm() {
  const [state, formAction, pending] = useActionState(recoveryRequestAction, initial);
  const [phone, setPhone] = React.useState('+7');

  return (
    <form action={formAction} className="space-y-4">
      {state.formError ? (
        <p className="text-sm text-destructive" role="alert">
          {state.formError}
        </p>
      ) : null}

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

      <Button type="submit" className="w-full" disabled={pending}>
        Отправить запрос хранителю
      </Button>

      <p className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Вернуться ко входу
        </Link>
      </p>
    </form>
  );
}
