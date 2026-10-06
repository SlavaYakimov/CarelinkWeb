'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createFamilyAction, type CreateFamilyFormState } from '@/server/actions/create-family';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: CreateFamilyFormState = {};

export function CreateFamilyForm() {
  const [state, formAction, pending] = useActionState(createFamilyAction, initial);

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-[520px] flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Создать ещё одну семью</h1>
        <p className="text-sm text-muted-foreground">
          Укажите отображаемое имя семьи. Workspace-адрес назначается на стороне сервиса.
        </p>
      </div>

      {state.formError ? (
        <p className="text-sm text-destructive" role="alert">
          {state.formError}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="familyName">Имя семьи</Label>
        <Input
          id="familyName"
          name="name"
          placeholder="Сидоровы"
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        {state.fieldErrors?.name ? (
          <p className="text-sm text-destructive" role="alert">
            {state.fieldErrors.name}
          </p>
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
        <Button type="submit" disabled={pending}>
          Создать семью
        </Button>
      </div>
    </form>
  );
}
