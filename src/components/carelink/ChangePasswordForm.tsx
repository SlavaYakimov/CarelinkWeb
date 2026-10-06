'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { changePasswordAction, type ChangePasswordState } from '@/server/actions/change-password';
import { PasswordField } from '@/components/carelink/PasswordField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: ChangePasswordState = {};

export type ChangePasswordFormProps = {
  workspaceEmail: string;
  nextPath: string;
};

export function ChangePasswordForm({ workspaceEmail, nextPath }: ChangePasswordFormProps) {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader>
        <span className="mb-2 inline-flex w-fit rounded-full bg-muted px-3 py-0.5 text-xs font-medium">
          Первый вход
        </span>
        <CardTitle className="text-2xl">Задайте свой пароль</CardTitle>
        <CardDescription>
          Вы вошли с одноразовым временным паролем из приглашения. Создайте постоянный пароль для
          входа.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="oldPassword" value={oldPassword} />
          <input type="hidden" name="newPassword" value={newPassword} />
          <input type="hidden" name="confirmPassword" value={confirmPassword} />

          <div className="space-y-2">
            <Label>Логин участника</Label>
            <div className="relative">
              <Input readOnly value={workspaceEmail} className="pr-10" />
              <CheckCircle2
                className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-success"
                aria-hidden
              />
            </div>
          </div>

          {state.formError ? (
            <p className="text-sm text-destructive" role="alert">
              {state.formError}
            </p>
          ) : null}

          <PasswordField
            id="oldPassword"
            label="Временный пароль из приглашения"
            value={oldPassword}
            onChange={setOldPassword}
            autoComplete="current-password"
            error={state.fieldErrors?.oldPassword}
            disabled={pending}
            showRequirements={false}
          />

          <PasswordField
            id="newPassword"
            label="Новый пароль"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            error={state.fieldErrors?.newPassword}
            disabled={pending}
          />

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

          <Button type="submit" className="w-full" disabled={pending}>
            Сохранить и продолжить
            <ArrowRight className="size-4" aria-hidden />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Для смены пароля нужно подтверждённое устройство — пройдите SMS, если ещё не делали
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
