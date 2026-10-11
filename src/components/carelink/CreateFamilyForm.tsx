'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createFamilyAction, type CreateFamilyFormState } from '@/server/actions/create-family';
import { createFamilyFormSchema } from '@/lib/forms/schemas';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import * as React from 'react';
import { FieldError } from '@/components/carelink/FieldError';
import { FormAlert } from '@/components/carelink/FormAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: CreateFamilyFormState = {};

export function CreateFamilyForm() {
  const [state, formAction, pending] = useActionState(createFamilyAction, initial);
  const [name, setName] = React.useState('');
  const gate = useFormGate(createFamilyFormSchema, { name }, ['name'], { pending });

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-[520px] flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Создать ещё одну семью</h1>
        <p className="text-sm text-muted-foreground">
          Укажите отображаемое имя семьи. Workspace-адрес назначается на стороне сервиса.
        </p>
      </div>

      {state.formError ? <FormAlert message={state.formError} /> : null}

      <div className="space-y-2">
        <Label htmlFor="familyName">Имя семьи</Label>
        <Input
          id="familyName"
          name="name"
          placeholder="Сидоровы"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        {state.fieldErrors?.name ? (
          <FieldError id="familyName-error">{state.fieldErrors.name}</FieldError>
        ) : (
          <p className="text-xs text-muted-foreground">Отображается в списках и приглашениях</p>
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
        Вы станете хранителем этой семьи.
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="secondary" asChild disabled={pending}>
          <Link href="/families">Отмена</Link>
        </Button>
        <SubmitButton type="submit" pending={pending} disabled={!gate.canSubmit}>
          Создать семью
        </SubmitButton>
      </div>
    </form>
  );
}
