import type { components } from '@/server/gateway/types.gen';

export type PendingMemberInvite = components['schemas']['PendingMemberInviteView'];

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
  const familyName = readString(row, 'familyName', 'family_name');
  const roleName = readString(row, 'roleName', 'role_name', 'roleDisplayName', 'role_display_name');
  const invitedByDisplayName = readString(
    row,
    'invitedByDisplayName',
    'invited_by_display_name',
    'invitedByName',
    'invited_by_name',
    'invitedBy',
    'invited_by',
  );
  const expiresAt = readString(row, 'expiresAt', 'expires_at');

  if (!id || !familyId || !familyName || !roleName || !invitedByDisplayName || !expiresAt) {
    return null;
  }

  return {
    id,
    familyId,
    familyName,
    roleName,
    invitedByDisplayName,
    expiresAt,
  };
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
