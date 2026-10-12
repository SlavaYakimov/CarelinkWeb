'use client';

import * as React from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { signInAction, type SignInFormState } from '@/server/actions/sign-in';
import { signInFormSchema } from '@/lib/forms/schemas';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { parseWorkspaceSlugFromLogin } from '@/lib/workspace-slug';
import { PasswordField } from '@/components/carelink/PasswordField';
import { WorkspaceSlugField } from '@/components/carelink/WorkspaceSlugField';
import { FormAlert } from '@/components/carelink/FormAlert';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { useFocusFirstError } from '@/components/carelink/use-focus-first-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initialState: SignInFormState = {};

export type LoginFormProps = {
  nextPath: string;
  defaultEmail?: string;
  notice?: 'phone-registered';
};

export function LoginForm({ nextPath, defaultEmail = '', notice }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [password, setPassword] = React.useState('');
  const defaultSlug =
    state.workspaceSlug !== undefined
      ? state.workspaceSlug
      : parseWorkspaceSlugFromLogin(defaultEmail);
  const [slug, setSlug] = React.useState(defaultSlug);

  React.useEffect(() => {
    if (state.workspaceSlug !== undefined) setSlug(state.workspaceSlug);
  }, [state.workspaceSlug]);

  const gate = useFormGate(
    signInFormSchema,
    { workspaceSlug: slug, password },
    ['workspaceSlug', 'password'],
    { pending },
  );

  useFocusFirstError(state.fieldErrors, state.formError);

  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Вход в Carelink</CardTitle>
        <CardDescription>Войдите с логином Carelink Workspace вашей семьи</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" onSubmit={() => gate.touchAll()}>
          <input type="hidden" name="next" value={nextPath} />

          {notice === 'phone-registered' && !state.formError ? (
            <Alert role="status">
              <AlertDescription>
                Этот номер уже есть в Carelink. Войдите с адресом своей семьи и её паролем.
              </AlertDescription>
            </Alert>
          ) : null}

          {state.formError ? <FormAlert message={state.formError} /> : null}

          <WorkspaceSlugField
            id="workspaceSlug"
            name="workspaceSlug"
            label="Адрес семьи (латиница)"
            value={slug}
            onChange={setSlug}
            onBlur={() => gate.touch('workspaceSlug')}
            error={state.fieldErrors?.workspaceSlug}
            disabled={pending}
            required
            autoComplete="username"
          />

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

          <SubmitButton
            type="submit"
            className="w-full"
            pending={pending}
            pendingLabel="Входим…"
            disabled={!gate.canSubmit}
          >
            Войти
            <ArrowRight className="size-4" aria-hidden />
          </SubmitButton>

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
