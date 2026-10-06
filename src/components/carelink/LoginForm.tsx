'use client';

import * as React from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';
import { signInAction, type SignInFormState } from '@/server/actions/sign-in';
import { PasswordField } from '@/components/carelink/PasswordField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState: SignInFormState = {};

export type LoginFormProps = {
  nextPath: string;
  defaultEmail?: string;
};

export function LoginForm({ nextPath, defaultEmail = '' }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [password, setPassword] = React.useState('');
  const email = state.workspaceEmail ?? defaultEmail;

  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Вход в Carelink</CardTitle>
        <CardDescription>Войдите с логином Carelink Workspace вашей семьи</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />

          {state.formError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="workspaceEmail">Workspace-логин</Label>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                Обязательно
              </span>
            </div>
            <div className="relative">
              <Building2
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="workspaceEmail"
                name="workspaceEmail"
                type="email"
                autoComplete="username"
                className="pl-9"
                placeholder="ivanovy@workspaces.carelink.app"
                defaultValue={email}
                aria-invalid={Boolean(state.fieldErrors?.workspaceEmail)}
                disabled={pending}
              />
            </div>
            {state.fieldErrors?.workspaceEmail ? (
              <p className="text-sm text-destructive" role="alert">
                {state.fieldErrors.workspaceEmail}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Логин выдаётся при создании семьи или приходит в письме-приглашении.
              </p>
            )}
          </div>

          <PasswordField
            id="password"
            label="Пароль"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            error={state.fieldErrors?.password}
            disabled={pending}
            showRequirements={false}
          />
          {state.fieldErrors?.password ? (
            <p className="text-xs text-muted-foreground">
              После нескольких неудачных попыток вход временно блокируется
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Не короче 8 символов</p>
          )}
          <input type="hidden" name="password" value={password} />

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="trustDevice"
              defaultChecked
              disabled={pending}
              className="size-4 rounded border border-primary accent-primary"
            />
            Доверять этому устройству
          </label>

          <Button type="submit" className="w-full" disabled={pending}>
            Войти
            <ArrowRight className="size-4" aria-hidden />
          </Button>

          <p className="text-center text-sm">
            <Link href="/login/recovery" className="text-primary hover:underline">
              Забыли пароль? Восстановить через семью
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/onboarding/email" className="text-primary hover:underline">
              + Создать новую семью
            </Link>
          </p>

          <div className="rounded-lg bg-muted/80 p-3 text-xs text-muted-foreground">
            Вход только через Carelink Workspace. Личная почта используется лишь для приглашений.
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
