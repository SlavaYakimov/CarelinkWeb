'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { FormAlert } from '@/components/carelink/FormAlert';
import { FieldError } from '@/components/carelink/FieldError';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { encryptStickyNotePlaintext } from '@/lib/sticky-notes/envelope-crypto';
import { STICKY_NOTE_FAMILY_KEY_MESSAGE } from '@/lib/sticky-notes/errors';
import { STICKY_NOTE_MAX_PLAINTEXT_CHARS } from '@/lib/sticky-notes/constants';
import { sendStickyNoteFormSchema } from '@/lib/sticky-notes/schemas';
import { sendStickyNoteAction, type SendStickyNoteState } from '@/server/actions/sticky-notes';
import type { FamilyMemberView } from '@/server/data/family-members';

const initial: SendStickyNoteState = {};

export type StickyNoteSendFormProps = {
  familyId: string;
  members: FamilyMemberView[];
  currentUserId: string;
};

export function StickyNoteSendForm({ familyId, members, currentUserId }: StickyNoteSendFormProps) {
  const [state, formAction, pending] = useActionState(sendStickyNoteAction, initial);
  const [recipientUserId, setRecipientUserId] = React.useState('');
  const [plaintext, setPlaintext] = React.useState('');
  const [clientNoteId] = React.useState(() => crypto.randomUUID());
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [envelopeJson, setEnvelopeJson] = React.useState('');

  const recipients = members.filter((m) => m.userId !== currentUserId);

  React.useEffect(() => {
    if (!recipientUserId && recipients[0]) {
      setRecipientUserId(recipients[0].userId);
    }
  }, [recipients, recipientUserId]);

  React.useEffect(() => {
    if (state.ok) {
      setPlaintext('');
      setEnvelopeJson('');
    }
  }, [state.ok]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    const parsed = sendStickyNoteFormSchema.safeParse({
      familyId,
      recipientUserId,
      clientNoteId,
      plaintext,
    });
    if (!parsed.success) {
      setLocalError(parsed.error.errors[0]?.message ?? 'Проверьте поля');
      return;
    }
    try {
      const envelope = await encryptStickyNotePlaintext({
        familyId,
        plaintext: parsed.data.plaintext,
      });
      setEnvelopeJson(JSON.stringify(envelope));
      const fd = new FormData(event.currentTarget);
      fd.set('envelope', JSON.stringify(envelope));
      fd.set('plaintextCharCount', String(parsed.data.plaintext.length));
      formAction(fd);
    } catch {
      setLocalError(STICKY_NOTE_FAMILY_KEY_MESSAGE);
    }
  };

  if (recipients.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Некому отправить записку — в семье пока только вы или список участников недоступен.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="familyId" value={familyId} />
      <input type="hidden" name="clientNoteId" value={clientNoteId} />
      <input type="hidden" name="envelope" value={envelopeJson} readOnly />

      <div className="space-y-2">
        <Label htmlFor="sticky-recipient">Кому</Label>
        <select
          id="sticky-recipient"
          name="recipientUserId"
          className={cn(
            'flex h-12 w-full rounded-[var(--radius-md)] border border-input bg-card px-3 text-base shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
          )}
          value={recipientUserId}
          onChange={(e) => setRecipientUserId(e.target.value)}
          required
        >
          {recipients.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.displayName}
            </option>
          ))}
        </select>
        {state.fieldErrors?.recipientUserId ? (
          <FieldError id="sticky-recipient-error">{state.fieldErrors.recipientUserId}</FieldError>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="sticky-text">Текст записки</Label>
          <span className="text-xs text-muted-foreground">
            {plaintext.length}/{STICKY_NOTE_MAX_PLAINTEXT_CHARS}
          </span>
        </div>
        <textarea
          id="sticky-text"
          name="plaintext"
          rows={5}
          maxLength={STICKY_NOTE_MAX_PLAINTEXT_CHARS}
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          className={cn(
            'flex min-h-[8rem] w-full rounded-[var(--radius-md)] border border-input bg-card px-3 py-2 text-base shadow-[var(--shadow-card)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
          )}
          placeholder="Напишите от души — текст увидят так, как вы его набрали."
          required
        />
        {state.fieldErrors?.plaintext ? (
          <FieldError id="sticky-text-error">{state.fieldErrors.plaintext}</FieldError>
        ) : null}
      </div>

      {localError ? <FormAlert message={localError} /> : null}
      {state.formError ? <FormAlert message={state.formError} /> : null}

      <SubmitButton pending={pending} disabled={pending || !plaintext.trim()}>
        Отправить записку
      </SubmitButton>
    </form>
  );
}
