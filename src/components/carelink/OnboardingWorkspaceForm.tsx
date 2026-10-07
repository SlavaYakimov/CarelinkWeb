'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  checkOnboardingWorkspaceSlugAction,
  finalizeOnboardingWorkspaceAction,
  type CheckOnboardingWorkspaceSlugResult,
  type OnboardingWorkspaceState,
} from '@/server/actions/onboarding';
import { formatWorkspaceLogin, isValidWorkspaceSlug } from '@/lib/workspace-slug';
import { StepShell } from '@/components/carelink/StepShell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: OnboardingWorkspaceState = {};

const SLUG_CHECK_DEBOUNCE_MS = 400;

export type OnboardingWorkspaceFormProps = {
  defaultSlug?: string;
  defaultDisplayName?: string;
};

type SlugCheckUi =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'done'; result: CheckOnboardingWorkspaceSlugResult };

function slugFieldError(serverError: string | undefined, check: SlugCheckUi): string | undefined {
  if (serverError) return serverError;
  if (check.phase !== 'done') return undefined;
  if (check.result.status === 'taken' || check.result.status === 'invalid') {
    return check.result.message;
  }
  return undefined;
}

function canSubmitSlug(slug: string, check: SlugCheckUi, pending: boolean): boolean {
  if (pending) return false;
  if (!slug.trim() || !isValidWorkspaceSlug(slug)) return false;
  if (check.phase === 'checking') return false;
  if (check.phase === 'done') {
    return check.result.status === 'available';
  }
  return false;
}

export function OnboardingWorkspaceForm({
  defaultSlug = '',
  defaultDisplayName = '',
}: OnboardingWorkspaceFormProps) {
  const [state, formAction, pending] = useActionState(finalizeOnboardingWorkspaceAction, initial);
  const [slug, setSlug] = React.useState(defaultSlug);
  const [slugCheck, setSlugCheck] = React.useState<SlugCheckUi>({ phase: 'idle' });
  const checkGeneration = React.useRef(0);

  const runSlugCheck = React.useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSlugCheck({ phase: 'idle' });
      return;
    }
    if (!isValidWorkspaceSlug(trimmed)) {
      setSlugCheck({
        phase: 'done',
        result: {
          status: 'invalid',
          message: 'Только латиница, цифры и дефис, от 3 до 32 символов',
        },
      });
      return;
    }

    const generation = ++checkGeneration.current;
    setSlugCheck({ phase: 'checking' });
    try {
      const result = await checkOnboardingWorkspaceSlugAction(trimmed);
      if (generation !== checkGeneration.current) return;
      setSlugCheck({ phase: 'done', result });
      if (result.status === 'available' || result.status === 'taken') {
        setSlug(result.workspaceSlug);
      }
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

  const preview =
    state.slugPreview ??
    (slugCheck.phase === 'done' &&
    (slugCheck.result.status === 'available' || slugCheck.result.status === 'taken')
      ? formatWorkspaceLogin(slugCheck.result.workspaceSlug)
      : slug
        ? formatWorkspaceLogin(slug)
        : '');

  const workspaceSlugError = slugFieldError(state.fieldErrors?.workspaceSlug, slugCheck);
  const submitEnabled = canSubmitSlug(slug, slugCheck, pending);

  return (
    <StepShell
      step={5}
      totalSteps={5}
      title="Адрес семьи"
      description="Выберите короткий адрес — из него соберётся workspace-логин для входа."
    >
      <form action={formAction} className="space-y-4">
        {state.formError ? (
          <Alert variant="destructive">
            <AlertDescription>{state.formError}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="displayName">Название семьи</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={defaultDisplayName}
            placeholder="Семья Ивановых"
            disabled={pending}
            required
          />
          {state.fieldErrors?.displayName ? (
            <p className="text-sm text-destructive">{state.fieldErrors.displayName}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="workspaceSlug">Адрес семьи</Label>
          <Input
            id="workspaceSlug"
            name="workspaceSlug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onBlur={() => void runSlugCheck(slug)}
            placeholder="ivanovy"
            autoComplete="off"
            disabled={pending}
            required
            aria-invalid={Boolean(workspaceSlugError)}
          />
          {workspaceSlugError ? (
            <p className="text-sm text-destructive">{workspaceSlugError}</p>
          ) : slugCheck.phase === 'checking' ? (
            <p className="text-xs text-muted-foreground">Проверяем, свободен ли адрес…</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Логин для входа: {preview || 'slug@workspaces.carelink.app'}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={!submitEnabled}>
          Создать семью
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>
    </StepShell>
  );
}
