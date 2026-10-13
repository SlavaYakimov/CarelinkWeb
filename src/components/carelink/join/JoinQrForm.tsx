'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { joinQrClientSchema } from '@/lib/forms/schemas';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { usePhoneField } from '@/components/carelink/use-phone-field';
import { joinQrRedeemAction, type JoinQrFormState } from '@/server/actions/join';
import { StepShell } from '@/components/carelink/StepShell';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { FormAlert } from '@/components/carelink/FormAlert';
import { FieldError } from '@/components/carelink/FieldError';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const initial: JoinQrFormState = {};

export type JoinQrFormProps = {
  joinToken: string;
  familyName: string;
  keeperDisplayName: string;
  roleLabel: string;
  expiresAt?: string;
};

export function JoinQrForm({
  joinToken,
  familyName,
  keeperDisplayName,
  roleLabel,
  expiresAt,
}: JoinQrFormProps) {
  const [state, formAction, pending] = useActionState(joinQrRedeemAction, initial);
  const [displayName, setDisplayName] = React.useState('');
  const phone = usePhoneField();
  const gate = useFormGate(
    joinQrClientSchema,
    { displayName, phone: phone.submitValue },
    ['displayName', 'phone'],
    { pending },
  );

  const expiresLabel = expiresAt
    ? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(expiresAt),
      )
    : null;

  return (
    <StepShell
      step={1}
      totalSteps={1}
      title="Вступление в семью"
      description="Укажите имя и телефон — хранитель подтвердит заявку."
    >
      <div className="space-y-4 rounded-lg border border-border/70 bg-muted/30 p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Семья:</span>{' '}
          <span className="font-medium text-foreground">{familyName}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Хранитель:</span>{' '}
          <span className="font-medium text-foreground">{keeperDisplayName}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Роль:</span>{' '}
          <span className="font-medium text-foreground">{roleLabel}</span>
        </p>
        {expiresLabel ? (
          <p className="text-xs text-muted-foreground">Приглашение действует до {expiresLabel}</p>
        ) : null}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="joinToken" value={joinToken} />
        <input type="hidden" name="phone" value={phone.submitValue} />
        {state.formError ? <FormAlert message={state.formError} /> : null}
        <div className="space-y-2">
          <Label htmlFor="displayName">Ваше имя</Label>
          <Input
            id="displayName"
            name="displayName"
            className="text-base"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={pending}
            autoComplete="name"
          />
          {state.fieldErrors?.displayName ? (
            <FieldError id="displayName-error">{state.fieldErrors.displayName}</FieldError>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="join-phone">Телефон</Label>
          <PhoneInput
            id="join-phone"
            value={phone.display}
            onChange={phone.onChange}
            disabled={pending}
            error={state.fieldErrors?.phone}
          />
          {state.fieldErrors?.phone ? (
            <FieldError id="phone-error">{state.fieldErrors.phone}</FieldError>
          ) : null}
        </div>
        <SubmitButton type="submit" pending={pending} disabled={!gate.canSubmit} className="w-full">
          Вступить
        </SubmitButton>
        <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }), 'w-full')}>
          Отказаться
        </Link>
      </form>
    </StepShell>
  );
}
