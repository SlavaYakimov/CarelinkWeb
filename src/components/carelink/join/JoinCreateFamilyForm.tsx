'use client';

import * as React from 'react';
import { useActionState } from 'react';
import {
  checkJoinFamilySlugAction,
  joinCreateFamilyAction,
  type JoinCreateFamilyState,
} from '@/server/actions/join';
import { joinCreateFamilyFormSchema } from '@/lib/forms/schemas';
import { suggestFamilySlugFromName, formatFamilyPublicUrl } from '@/lib/family-slug';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { StepShell } from '@/components/carelink/StepShell';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { FormAlert } from '@/components/carelink/FormAlert';
import { FieldError } from '@/components/carelink/FieldError';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: JoinCreateFamilyState = {};
const SLUG_DEBOUNCE_MS = 400;

export function JoinCreateFamilyForm() {
  const [state, formAction, pending] = useActionState(joinCreateFamilyAction, initial);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [slugStatus, setSlugStatus] = React.useState<'idle' | 'checking' | 'available' | 'taken'>(
    'idle',
  );
  const checkGen = React.useRef(0);

  React.useEffect(() => {
    if (!slugTouched && name.trim()) {
      setSlug(suggestFamilySlugFromName(name));
    }
  }, [name, slugTouched]);

  React.useEffect(() => {
    if (!slug.trim()) {
      setSlugStatus('idle');
      return;
    }
    const gen = ++checkGen.current;
    setSlugStatus('checking');
    const timer = window.setTimeout(() => {
      void checkJoinFamilySlugAction(slug).then((res) => {
        if (gen !== checkGen.current) return;
        setSlugStatus(res.available ? 'available' : 'taken');
      });
    }, SLUG_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [slug]);

  const gate = useFormGate(joinCreateFamilyFormSchema, { name, slug }, ['name', 'slug'], {
    pending,
    extraOk: slugStatus === 'available' || slugStatus === 'idle',
  });

  return (
    <StepShell
      step={1}
      totalSteps={1}
      title="Создать семью"
      description="Название и короткий адрес — по ним вас найдут родственники."
    >
      <form action={formAction} className="space-y-4">
        {state.formError ? <FormAlert message={state.formError} /> : null}
        <div className="space-y-2">
          <Label htmlFor="family-name">Название семьи</Label>
          <Input
            id="family-name"
            name="name"
            className="text-base"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
            maxLength={64}
          />
          {state.fieldErrors?.name ? (
            <FieldError id="family-name-error">{state.fieldErrors.name}</FieldError>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="family-slug">Адрес семьи</Label>
          <Input
            id="family-slug"
            name="slug"
            className="text-base"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            disabled={pending}
            autoComplete="off"
          />
          <p className="text-sm text-muted-foreground">{formatFamilyPublicUrl(slug || '…')}</p>
          {slugStatus === 'checking' ? (
            <p className="text-sm text-muted-foreground">Проверяем, свободен ли адрес…</p>
          ) : null}
          {slugStatus === 'available' ? (
            <p className="text-sm text-muted-foreground">Адрес свободен</p>
          ) : null}
          {slugStatus === 'taken' ? (
            <FieldError id="family-slug-taken">Это имя уже занято</FieldError>
          ) : null}
          {state.fieldErrors?.slug ? (
            <FieldError id="family-slug-error">{state.fieldErrors.slug}</FieldError>
          ) : null}
        </div>
        <SubmitButton type="submit" pending={pending} disabled={!gate.canSubmit} className="w-full">
          Создать семью
        </SubmitButton>
      </form>
    </StepShell>
  );
}
