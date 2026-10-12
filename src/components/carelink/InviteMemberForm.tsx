'use client';

import * as React from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import {
  createMemberInviteAction,
  lookupMemberInviteEmailAction,
  type CreateMemberInviteState,
  type InviteLookupState,
} from '@/server/actions/invites';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { FieldError } from '@/components/carelink/FieldError';
import { FormAlert } from '@/components/carelink/FormAlert';
import { usePhoneField } from '@/components/carelink/use-phone-field';
import { memberInviteClientSchema } from '@/lib/forms/schemas';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RoleTemplate } from '@/server/data/family-invites';

const createInitial: CreateMemberInviteState = {};
const lookupInitial: InviteLookupState = {};

export type InviteMemberFormProps = {
  familyId: string;
  roleTemplates: RoleTemplate[];
};

export function InviteMemberForm({ familyId, roleTemplates }: InviteMemberFormProps) {
  const [state, formAction, pending] = useActionState(createMemberInviteAction, createInitial);
  const [lookupState, lookupAction] = useActionState(lookupMemberInviteEmailAction, lookupInitial);
  const phone = usePhoneField();
  const [displayName, setDisplayName] = React.useState('');
  const [personalEmail, setPersonalEmail] = React.useState('');
  const [roleTemplateId, setRoleTemplateId] = React.useState(roleTemplates[0]?.id ?? '');
  const [registeredHint, setRegisteredHint] = React.useState<string>('');

  const gate = useFormGate(
    memberInviteClientSchema,
    {
      displayName,
      personalEmail,
      phone: phone.submitValue,
      roleTemplateId,
    },
    ['displayName', 'personalEmail', 'phone', 'roleTemplateId'],
    { pending },
  );

  React.useEffect(() => {
    if (roleTemplates.length && !roleTemplateId) {
      setRoleTemplateId(roleTemplates[0]!.id);
    }
  }, [roleTemplates, roleTemplateId]);

  React.useEffect(() => {
    if (lookupState.registered === undefined) return;
    setRegisteredHint(String(lookupState.registered));
  }, [lookupState.registered]);

  React.useEffect(() => {
    const email = personalEmail.trim();
    if (!email || !email.includes('@')) return;
    const timer = window.setTimeout(() => {
      const fd = new FormData();
      fd.set('familyId', familyId);
      fd.set('email', email);
      lookupAction(fd);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [personalEmail, familyId, lookupAction]);

  const lookupMessage = lookupState.error
    ? lookupState.error
    : lookupState.registered === true
      ? 'Уже в Carelink — пароль не изменится, нужно принять приглашение'
      : lookupState.registered === false
        ? 'Новый пользователь — получит логин и временный пароль на почту'
        : personalEmail.includes('@')
          ? 'Проверяем…'
          : null;

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-[640px] flex-col gap-6">
      <input type="hidden" name="familyId" value={familyId} />
      <input type="hidden" name="phone" value={phone.submitValue} />
      <input type="hidden" name="registeredHint" value={registeredHint} />

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Пригласить участника</h1>
        <p className="text-sm text-muted-foreground">
          Укажите имя, личную почту и телефон. Мы проверим, есть ли уже аккаунт Carelink.
        </p>
      </div>

      {lookupState.error ? <FormAlert message={lookupState.error} /> : null}
      {state.formError ? <FormAlert message={state.formError} /> : null}

      <div className="space-y-2">
        <Label htmlFor="displayName">Имя в семье</Label>
        <Input
          id="displayName"
          name="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={64}
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
        />
        {state.fieldErrors?.displayName ? (
          <FieldError id="displayName-error">{state.fieldErrors.displayName}</FieldError>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="personalEmail">Личная почта</Label>
        <Input
          id="personalEmail"
          name="personalEmail"
          type="email"
          autoComplete="email"
          value={personalEmail}
          onChange={(e) => setPersonalEmail(e.target.value)}
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.personalEmail)}
        />
        {lookupMessage ? (
          <p
            className={
              lookupState.error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'
            }
            role="status"
          >
            {lookupMessage}
          </p>
        ) : null}
        {state.fieldErrors?.personalEmail ? (
          <FieldError id="personalEmail-error">{state.fieldErrors.personalEmail}</FieldError>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Телефон</Label>
        <PhoneInput
          id="phone"
          value={phone.display}
          onChange={phone.onChange}
          disabled={pending}
          error={state.fieldErrors?.phone}
        />
        {state.fieldErrors?.phone ? (
          <FieldError id="phone-error">{state.fieldErrors.phone}</FieldError>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleTemplateId">Роль</Label>
        <select
          id="roleTemplateId"
          name="roleTemplateId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={roleTemplateId}
          onChange={(e) => setRoleTemplateId(e.target.value)}
          disabled={pending || roleTemplates.length === 0}
        >
          {roleTemplates.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.roleTemplateId ? (
          <FieldError id="roleTemplateId-error">{state.fieldErrors.roleTemplateId}</FieldError>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatarFile">Фото (необязательно)</Label>
        <Input id="avatarFile" name="avatarFile" type="file" accept="image/*" disabled={pending} />
        {state.fieldErrors?.avatarUrl ? (
          <FieldError id="avatarFile-error">{state.fieldErrors.avatarUrl}</FieldError>
        ) : null}
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="secondary" asChild disabled={pending}>
          <Link href={`/families/${familyId}/invites`}>Отмена</Link>
        </Button>
        <SubmitButton type="submit" pending={pending} disabled={!gate.canSubmit}>
          Отправить приглашение
        </SubmitButton>
      </div>
    </form>
  );
}
