'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  checkOnboardingWorkspaceSlugAction,
  finalizeOnboardingWorkspaceAction,
  type OnboardingWorkspaceState,
} from '@/server/actions/onboarding';
import { onboardingWorkspaceFormSchema } from '@/lib/forms/schemas';
import { mergeFieldError } from '@/lib/forms/client-field-error';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { isSlugAvailabilityOk, type WorkspaceSlugCheckUi } from '@/lib/forms/workspace-gate';
import { formatWorkspaceLogin } from '@/lib/workspace-slug';
import { StepShell } from '@/components/carelink/StepShell';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { FormAlert } from '@/components/carelink/FormAlert';
import { WorkspaceSlugField } from '@/components/carelink/WorkspaceSlugField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: OnboardingWorkspaceState = {};

const SLUG_CHECK_DEBOUNCE_MS = 400;

export type OnboardingWorkspaceFormProps = {
  defaultSlug?: string;
  defaultDisplayName?: string;
};

function slugFieldError(
  serverError: string | undefined,
  check: WorkspaceSlugCheckUi,
): string | undefined {
  if (serverError) return serverError;
  if (check.phase !== 'done') return undefined;
  if (check.result.status === 'taken' || check.result.status === 'invalid') {
    return check.result.message;
  }
  return undefined;
}

export function OnboardingWorkspaceForm({
  defaultSlug = '',
  defaultDisplayName = '',
}: OnboardingWorkspaceFormProps) {
  const [state, formAction, pending] = useActionState(finalizeOnboardingWorkspaceAction, initial);
  const [slug, setSlug] = React.useState(defaultSlug);
  const [displayName, setDisplayName] = React.useState(defaultDisplayName);
  const [slugCheck, setSlugCheck] = React.useState<WorkspaceSlugCheckUi>({ phase: 'idle' });
  const checkGeneration = React.useRef(0);

  const gate = useFormGate(
    onboardingWorkspaceFormSchema,
    { workspaceSlug: slug, displayName },
    ['workspaceSlug', 'displayName'],
    {
      pending,
      extraOk: isSlugAvailabilityOk(slugCheck),
    },
  );

  const runSlugCheck = React.useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSlugCheck({ phase: 'idle' });
      return;
    }

    const generation = ++checkGeneration.current;
    setSlugCheck({ phase: 'checking' });
    try {
      const result = await checkOnboardingWorkspaceSlugAction(trimmed);
      if (generation !== checkGeneration.current) return;
      setSlugCheck({ phase: 'done', result });
    } catch {
      if (generation !== checkGeneration.current) return;
      setSlugCheck({
        phase: 'done',
        result: { status: 'error', message: 'Не удалось проверить адрес. Попробуйте ещё раз' },
      });
    }
  }, []);

  React.useEffect(() => {
    if (!slug.trim()) {
      setSlugCheck({ phase: 'idle' });
      return;
    }
    const timer = window.setTimeout(() => {
      void runSlugCheck(slug);
    }, SLUG_CHECK_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [slug, runSlugCheck]);

  const workspaceSlugError =
    mergeFieldError(gate, 'workspaceSlug') ??
    slugFieldError(state.fieldErrors?.workspaceSlug, slugCheck);

  const slugFooter =
    slugCheck.phase === 'checking' ? (
      <p className="text-xs text-muted-foreground">Проверяем, свободен ли адрес…</p>
    ) : slugCheck.phase === 'done' && slugCheck.result.status === 'available' ? (
      <p className="text-xs text-muted-foreground">
        Логин для входа: {formatWorkspaceLogin(slugCheck.result.workspaceSlug ?? slug)}
      </p>
    ) : null;

  return (
    <StepShell
      step={5}
      totalSteps={5}
      title="Адрес семьи"
      description="Выберите короткий адрес семьи — из него соберётся логин для входа."
    >
      <form action={formAction} className="space-y-4">
        {state.formError ? <FormAlert message={state.formError} /> : null}
        <div className="space-y-2">
          <Label htmlFor="displayName">Название семьи</Label>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="off"
            maxLength={64}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Семья Ивановых"
            disabled={pending}
            required
            aria-invalid={Boolean(state.fieldErrors?.displayName)}
          />
          {state.fieldErrors?.displayName ? (
            <p className="text-sm text-destructive" role="alert">
              {state.fieldErrors.displayName}
            </p>
          ) : null}
        </div>
        <WorkspaceSlugField
          id="workspaceSlug"
          name="workspaceSlug"
          label="Адрес семьи"
          hint="Часть логина для входа до @"
          value={slug}
          onChange={setSlug}
          onBlur={() => {
            gate.touch('workspaceSlug');
            void runSlugCheck(slug);
          }}
          error={workspaceSlugError}
          disabled={pending}
          required
          footer={slugFooter}
        />
        <SubmitButton type="submit" className="w-full" pending={pending} disabled={!gate.canSubmit}>
          Создать семью
          <ArrowRight className="size-4" aria-hidden />
        </SubmitButton>
      </form>
    </StepShell>
  );
}
