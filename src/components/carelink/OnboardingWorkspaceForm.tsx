'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  finalizeOnboardingWorkspaceAction,
  type OnboardingWorkspaceState,
} from '@/server/actions/onboarding';
import { formatWorkspaceLogin } from '@/lib/workspace-slug';
import { StepShell } from '@/components/carelink/StepShell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: OnboardingWorkspaceState = {};

export type OnboardingWorkspaceFormProps = {
  defaultSlug?: string;
  defaultDisplayName?: string;
};

export function OnboardingWorkspaceForm({
  defaultSlug = '',
  defaultDisplayName = '',
}: OnboardingWorkspaceFormProps) {
  const [state, formAction, pending] = useActionState(finalizeOnboardingWorkspaceAction, initial);
  const [slug, setSlug] = React.useState(defaultSlug);
  const preview = state.slugPreview ?? (slug ? formatWorkspaceLogin(slug) : '');

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
            placeholder="ivanovy"
            autoComplete="off"
            disabled={pending}
            required
          />
          {state.fieldErrors?.workspaceSlug ? (
            <p className="text-sm text-destructive">{state.fieldErrors.workspaceSlug}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Логин для входа: {preview || 'slug@workspaces.carelink.app'}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          Создать семью
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>
    </StepShell>
  );
}
