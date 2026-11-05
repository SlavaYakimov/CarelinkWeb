'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { StickyNotePlaintext } from '@/components/carelink/sticky-notes/StickyNotePlaintext';
import { FormAlert } from '@/components/carelink/FormAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { decryptStickyNoteContent } from '@/lib/sticky-notes/envelope-crypto';
import { STICKY_NOTE_FAMILY_KEY_MESSAGE } from '@/lib/sticky-notes/errors';
import type { components } from '@/server/gateway/types.gen';
import {
  deleteStickyNoteAction,
  markStickyNoteReadAction,
  type StickyNoteMutationState,
} from '@/server/actions/sticky-notes';
import type { FamilyMemberView } from '@/server/data/family-members';

type StickyNote = components['schemas']['StickyNote'];

const readInitial: StickyNoteMutationState = {};
const deleteInitial: StickyNoteMutationState = {};

export type StickyNoteWidgetCardProps = {
  familyId: string;
  note: StickyNote | null;
  members?: FamilyMemberView[] | null;
};

function senderDisplayName(
  note: StickyNote,
  members: FamilyMemberView[] | null | undefined,
): string {
  const match = members?.find((m) => m.userId === note.senderUserId);
  return match?.displayName ?? 'Близкий человек';
}

export function StickyNoteWidgetCard({ familyId, note, members }: StickyNoteWidgetCardProps) {
  const [plaintext, setPlaintext] = React.useState<string | null>(null);
  const [decryptError, setDecryptError] = React.useState<string | null>(null);
  const [readState, readAction, readPending] = useActionState(
    markStickyNoteReadAction,
    readInitial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStickyNoteAction,
    deleteInitial,
  );

  React.useEffect(() => {
    if (!note) {
      setPlaintext(null);
      setDecryptError(null);
      return;
    }
    let cancelled = false;
    decryptStickyNoteContent({
      familyId,
      contentCiphertext: note.contentCiphertext,
      contentEnvelope: note.contentEnvelope,
    })
      .then((text) => {
        if (!cancelled) {
          setPlaintext(text);
          setDecryptError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlaintext(null);
          setDecryptError(STICKY_NOTE_FAMILY_KEY_MESSAGE);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [familyId, note]);

  if (!note) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Записка для вас</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Пока нет новых записок от близких.</p>
        </CardContent>
      </Card>
    );
  }

  const unread = note.readAt == null || note.readAt === '';
  const sender = senderDisplayName(note, members);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Записка для вас</CardTitle>
        <p className="text-sm text-muted-foreground">
          От {sender}
          {unread ? ' · новая' : null}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {decryptError ? <FormAlert message={decryptError} /> : null}
        {plaintext != null ? <StickyNotePlaintext text={plaintext} /> : null}
        {readState.formError ? <FormAlert message={readState.formError} /> : null}
        {deleteState.formError ? <FormAlert message={deleteState.formError} /> : null}
        <div className="flex flex-wrap gap-2">
          {unread ? (
            <form action={readAction}>
              <input type="hidden" name="familyId" value={familyId} />
              <input type="hidden" name="noteId" value={note.id} />
              <Button type="submit" variant="secondary" disabled={readPending}>
                Отметить прочитанной
              </Button>
            </form>
          ) : null}
          <form action={deleteAction}>
            <input type="hidden" name="familyId" value={familyId} />
            <input type="hidden" name="noteId" value={note.id} />
            <Button type="submit" variant="ghost" disabled={deletePending}>
              Скрыть
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
