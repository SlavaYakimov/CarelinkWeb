import type { components } from '@/server/gateway/types.gen';

export type PendingMemberInvite = components['schemas']['PendingMemberInviteView'];

export const PENDING_INVITE_FALLBACK_FAMILY_NAME = 'Семья';
export const PENDING_INVITE_FALLBACK_DASH = '—';

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

/** Map gateway / family-service JSON variants to OpenAPI PendingMemberInviteView. */
export function normalizePendingMemberInvite(raw: unknown): PendingMemberInvite | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;

  const id = readString(row, 'id', 'inviteId', 'invite_id');
  const familyId = readString(row, 'familyId', 'family_id');

  if (!id || !familyId) {
    return null;
  }

  const familyName =
    readString(row, 'familyName', 'family_name') ?? PENDING_INVITE_FALLBACK_FAMILY_NAME;
  const roleName =
    readString(row, 'roleName', 'role_name', 'roleDisplayName', 'role_display_name') ??
    PENDING_INVITE_FALLBACK_DASH;
  const invitedByDisplayName =
    readString(
      row,
      'invitedByDisplayName',
      'invited_by_display_name',
      'invitedByName',
      'invited_by_name',
      'invitedBy',
      'invited_by',
    ) ?? PENDING_INVITE_FALLBACK_DASH;
  const expiresAt = readString(row, 'expiresAt', 'expires_at') ?? '';

  return {
    id,
    familyId,
    familyName,
    roleName,
    invitedByDisplayName,
    expiresAt,
  };
}

export function pendingInviteHasExpiry(expiresAt: string | undefined): boolean {
  return Boolean(expiresAt?.trim());
}

export function extractPendingMemberInviteRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.pending)) return record.pending;
  if (Array.isArray(record.invites)) return record.invites;
  return [];
}

export function normalizePendingMemberInviteList(payload: unknown): PendingMemberInvite[] {
  return extractPendingMemberInviteRows(payload)
    .map((row) => normalizePendingMemberInvite(row))
    .filter((row): row is PendingMemberInvite => row !== null);
}
