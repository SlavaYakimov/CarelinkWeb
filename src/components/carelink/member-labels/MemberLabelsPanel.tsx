'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { MemberLabelBadge } from '@/components/carelink/member-labels/MemberLabelBadge';
import { FormAlert } from '@/components/carelink/FormAlert';
import { FieldError } from '@/components/carelink/FieldError';
import { SubmitButton } from '@/components/carelink/SubmitButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MEMBER_LABEL_MAX_TARGETS, MEMBER_LABEL_MAX_TEXT } from '@/lib/member-labels/constants';
import { MEMBER_LABEL_SELECTION_LIMIT_MESSAGE } from '@/lib/member-labels/errors';
import {
  assignMemberLabelsAction,
  deleteMemberLabelAction,
  type AssignMemberLabelsState,
  type MemberLabelDeleteState,
} from '@/server/actions/member-labels';
import type { FamilyMemberView } from '@/server/data/family-members';
import type { components } from '@/server/gateway/types.gen';

type MemberLabelView = components['schemas']['MemberLabelView'];

const assignInitial: AssignMemberLabelsState = {};
const deleteInitial: MemberLabelDeleteState = {};

export type MemberLabelsPanelProps = {
  familyId: string;
  members: FamilyMemberView[];
  labels: MemberLabelView[];
  currentUserId: string;
};

export function MemberLabelsPanel({
  familyId,
  members,
  labels,
  currentUserId,
}: MemberLabelsPanelProps) {
  const [assignState, assignAction, assignPending] = useActionState(
    assignMemberLabelsAction,
    assignInitial,
  );
  const [, deleteAction] = useActionState(deleteMemberLabelAction, deleteInitial);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [labelText, setLabelText] = React.useState('');
  const [selectionError, setSelectionError] = React.useState<string | null>(null);

  const labelsByTarget = React.useMemo(() => {
    const map = new Map<string, MemberLabelView[]>();
    for (const label of labels) {
      const list = map.get(label.targetUserId) ?? [];
      list.push(label);
      map.set(label.targetUserId, list);
    }
    return map;
  }, [labels]);

  const toggle = (userId: string, checked: boolean) => {
    setSelectionError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        if (next.size >= MEMBER_LABEL_MAX_TARGETS && !next.has(userId)) {
          setSelectionError(MEMBER_LABEL_SELECTION_LIMIT_MESSAGE);
          return prev;
        }
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectionError(null);
    const ids = members.map((m) => m.userId).slice(0, MEMBER_LABEL_MAX_TARGETS);
    if (members.length > MEMBER_LABEL_MAX_TARGETS) {
      setSelectionError(MEMBER_LABEL_SELECTION_LIMIT_MESSAGE);
    }
    setSelected(new Set(ids));
  };

  const clearSelection = () => {
    setSelected(new Set());
    setSelectionError(null);
  };

  React.useEffect(() => {
    if (assignState.ok) {
      setSelected(new Set());
      setLabelText('');
    }
  }, [assignState.ok]);

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Назначить метку</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={selectAll}
            >
              Выбрать всех
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={clearSelection}
            >
              Сбросить
            </button>
          </div>
        </div>

        <ul className="space-y-3">
          {members.map((member) => {
            const checked = selected.has(member.userId);
            const memberLabels = labelsByTarget.get(member.userId) ?? [];
            return (
              <li
                key={member.userId}
                className="flex flex-wrap items-start gap-3 rounded-lg border border-border/70 px-3 py-2"
              >
                <Checkbox
                  id={`member-${member.userId}`}
                  checked={checked}
                  onCheckedChange={(v) => toggle(member.userId, v === true)}
                  aria-label={`Выбрать ${member.displayName}`}
                />
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`member-${member.userId}`} className="font-medium">
                    {member.displayName}
                    {member.userId === currentUserId ? ' (вы)' : ''}
                  </Label>
                  {memberLabels.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {memberLabels.map((label) => (
                        <form key={label.labelId} action={deleteAction} className="inline-flex">
                          <input type="hidden" name="familyId" value={familyId} />
                          <input type="hidden" name="labelId" value={label.labelId} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            title="Снять метку"
                          >
                            <MemberLabelBadge text={label.labelText} />
                            <span className="sr-only">Снять</span>
                          </button>
                        </form>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {selectionError ? <FormAlert message={selectionError} /> : null}

        <form action={assignAction} className="space-y-3">
          <input type="hidden" name="familyId" value={familyId} />
          {Array.from(selected).map((id) => (
            <input key={id} type="hidden" name="targetUserIds" value={id} />
          ))}
          <div className="space-y-2">
            <Label htmlFor="label-text">Текст метки</Label>
            <Input
              id="label-text"
              name="labelText"
              maxLength={MEMBER_LABEL_MAX_TEXT}
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              placeholder="Например: на связи"
              required
            />
            {assignState.fieldErrors?.labelText ? (
              <FieldError id="label-text-error">{assignState.fieldErrors.labelText}</FieldError>
            ) : null}
          </div>
          {assignState.formError ? <FormAlert message={assignState.formError} /> : null}
          {assignState.batchFailures?.length ? (
            <ul className="text-sm text-destructive" role="alert">
              {assignState.batchFailures.map((f) => (
                <li key={f.userId}>
                  {f.userId}: {f.reason}
                </li>
              ))}
            </ul>
          ) : null}
          <SubmitButton pending={assignPending} disabled={assignPending || selected.size === 0}>
            Назначить ({selected.size})
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
