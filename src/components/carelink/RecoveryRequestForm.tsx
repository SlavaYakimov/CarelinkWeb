'use client';

import * as React from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { recoveryRequestAction, type RecoveryRequestFormState } from '@/server/actions/recovery';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

      <div className="space-y-2">
        <Label htmlFor="familySlug">Адрес семьи (латиница)</Label>
        <div className="flex overflow-hidden rounded-lg border border-input bg-card shadow-card focus-within:ring-[3px] focus-within:ring-ring">
          <Input
            id="familySlug"
            name="familySlug"
            className="border-0 shadow-none focus-visible:ring-0"
            placeholder="ivanovy"
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.familySlug)}
          />
          <span className="flex items-center border-l border-border bg-muted px-3 text-sm text-muted-foreground">
            @workspaces.carelink.app
          </span>
        </div>
        {state.fieldErrors?.familySlug ? (
          <p className="text-sm text-destructive" role="alert">
            {state.fieldErrors.familySlug}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Часть workspace-логина до @</p>
        )}
      </div>

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
