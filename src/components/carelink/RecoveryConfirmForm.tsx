'use client';

import * as React from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { recoveryConfirmAction, type RecoveryConfirmFormState } from '@/server/actions/recovery';
import { recoveryConfirmClientSchema } from '@/lib/forms/schemas';
import { mergeFieldError } from '@/lib/forms/client-field-error';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { FormAlert } from '@/components/carelink/FormAlert';
import { OtpInput } from '@/components/carelink/OtpInput';
import { PasswordField } from '@/components/carelink/PasswordField';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { useFocusFirstError } from '@/components/carelink/use-focus-first-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: RecoveryConfirmFormState = {};

export type RecoveryConfirmFormProps = {
  phoneMasked?: string;
};

export function RecoveryConfirmForm({ phoneMasked }: RecoveryConfirmFormProps) {
  const [state, formAction, pending] = useActionState(recoveryConfirmAction, initial);
  const [requestId, setRequestId] = React.useState('');
  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [confirmTouched, setConfirmTouched] = React.useState(false);

  const gate = useFormGate(
    recoveryConfirmClientSchema,
    { requestId, code, newPassword: password, confirmPassword },
    ['requestId', 'code', 'newPassword', 'confirmPassword'],
    { pending },
  );

  useFocusFirstError(state.fieldErrors, state.formError);

  const confirmError =
    state.fieldErrors?.confirmPassword ??
    (confirmTouched && password !== confirmPassword ? 'Пароли не совпадают' : undefined);

  return (
    <form action={formAction} className="space-y-4" onSubmit={() => gate.touchAll()}>
      <input type="hidden" name="next" value="/families" />

      {state.formError ? <FormAlert message={state.formError} /> : null}

      {phoneMasked ? (
        <p className="text-sm text-muted-foreground">Код из SMS на {phoneMasked}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="requestId">Идентификатор запроса</Label>
        <Input
          id="requestId"
          name="requestId"
          autoComplete="off"
          spellCheck={false}
          maxLength={64}
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
          onBlur={() => gate.touch('requestId')}
          placeholder="Из SMS после одобрения хранителем"
          disabled={pending}
          aria-invalid={Boolean(mergeFieldError(gate, 'requestId', state.fieldErrors?.requestId))}
        />
        {mergeFieldError(gate, 'requestId', state.fieldErrors?.requestId) ? (
          <p className="text-sm text-destructive" role="alert">
            {mergeFieldError(gate, 'requestId', state.fieldErrors?.requestId)}
          </p>
        ) : null}
      </div>

      <OtpInput
        id="recovery-otp"
        labelText="Код из SMS"
        name="code"
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
        error={mergeFieldError(gate, 'newPassword', state.fieldErrors?.newPassword)}
        disabled={pending}
        onBlur={() => gate.touch('newPassword')}
      />
      <input type="hidden" name="newPassword" value={password} />

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
          confirmError
        }
        disabled={pending}
        showRequirements={false}
        onBlur={() => gate.touch('confirmPassword')}
      />
      <input type="hidden" name="confirmPassword" value={confirmPassword} />

      <p className="text-xs text-muted-foreground">
        Восстановление одноразовое и ограничено по времени.
      </p>

      <SubmitButton type="submit" className="w-full" pending={pending} disabled={!gate.canSubmit}>
        Сохранить и войти
      </SubmitButton>

      <p className="text-center text-sm">
        <Link
          href="/login/recovery"
          className="inline-flex min-h-11 items-center text-primary hover:underline"
        >
          Запросить восстановление заново
        </Link>
      </p>
    </form>
  );
}
