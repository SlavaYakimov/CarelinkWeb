'use client';

import * as React from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { recoveryConfirmAction, type RecoveryConfirmFormState } from '@/server/actions/recovery';
import { OtpInput } from '@/components/carelink/OtpInput';
import { PasswordField } from '@/components/carelink/PasswordField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: RecoveryConfirmFormState = {};

export type RecoveryConfirmFormProps = {
  phoneMasked?: string;
};

export function RecoveryConfirmForm({ phoneMasked }: RecoveryConfirmFormProps) {
  const [state, formAction, pending] = useActionState(recoveryConfirmAction, initial);
  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value="/families" />
      <input type="hidden" name="code" value={code} />

      {state.formError ? (
        <p className="text-sm text-destructive" role="alert">
          {state.formError}
        </p>
      ) : null}

      {phoneMasked ? (
        <p className="text-sm text-muted-foreground">Код из SMS на {phoneMasked}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="requestId">Идентификатор запроса</Label>
        <Input
          id="requestId"
          name="requestId"
          placeholder="Из SMS после одобрения хранителем"
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.requestId)}
        />
        {state.fieldErrors?.requestId ? (
          <p className="text-sm text-destructive" role="alert">
            {state.fieldErrors.requestId}
          </p>
        ) : null}
      </div>

      <OtpInput
        id="recovery-otp"
        value={code}
        onChange={setCode}
        length={6}
        error={state.fieldErrors?.code}
        disabled={pending}
      />

      <PasswordField
        id="newPassword"
        label="Новый пароль"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        error={state.fieldErrors?.newPassword}
        disabled={pending}
      />
      <input type="hidden" name="newPassword" value={password} />

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

      <p className="text-xs text-muted-foreground">
        Восстановление одноразовое и ограничено по времени.
      </p>

      <Button type="submit" className="w-full" disabled={pending}>
        Сохранить и войти
      </Button>

      <p className="text-center text-sm">
        <Link href="/login/recovery" className="text-primary hover:underline">
          Запросить восстановление заново
        </Link>
      </p>
    </form>
  );
}
