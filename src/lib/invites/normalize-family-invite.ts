import type { components } from '@/server/gateway/types.gen';
import { normalizeMemberInviteStatus } from '@/lib/invites/status-labels';

export type MemberInviteView = components['schemas']['MemberInviteView'];

const FALLBACK_CREATED_AT = '1970-01-01T00:00:00.000Z';

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function readEmailMasked(record: Record<string, unknown>): string | undefined {
  const masked = readString(
    record,
    'emailMasked',
    'email_masked',
    'inviteeEmailMasked',
    'invitee_email_masked',
  );
  if (masked) return masked;

  const email = readString(
    record,
    'personalEmail',
    'personal_email',
    'inviteeEmail',
    'invitee_email',
    'email',
  );
  if (email) return maskEmail(email);
  return undefined;
}

export type NormalizeFamilyInviteDropReason = 'missing_id' | 'invalid_row';

/** Map gateway / family-service JSON variants to OpenAPI MemberInviteView. */
export function normalizeFamilyMemberInvite(
  raw: unknown,
): { invite: MemberInviteView } | { drop: NormalizeFamilyInviteDropReason } {
  if (!raw || typeof raw !== 'object') {
    return { drop: 'invalid_row' };
  }
  const row = raw as Record<string, unknown>;

  const id = readString(row, 'id', 'inviteId', 'invite_id');
  if (!id) {
    return { drop: 'missing_id' };
  }

  const displayName =
    readString(
      row,
      'displayName',
      'display_name',
      'name',
      'inviteeDisplayName',
      'invitee_display_name',
    ) ?? '—';
  const roleName =
    readString(row, 'roleName', 'role_name', 'roleDisplayName', 'role_display_name') ?? '—';
  const statusRaw = readString(row, 'status');
  const createdAt =
    readString(
      row,
      'createdAt',
      'created_at',
      'invitedAt',
      'invited_at',
      'updatedAt',
      'updated_at',
    ) ?? FALLBACK_CREATED_AT;
  const expiresAt = readString(row, 'expiresAt', 'expires_at');
  const phone = readString(row, 'phone', 'phoneE164', 'phone_e164');
  const inviteeKindRaw = readString(row, 'inviteeKind', 'invitee_kind');

  const status = normalizeMemberInviteStatus(statusRaw ?? 'sent');
  const emailMasked = readEmailMasked(row);

  const invite: MemberInviteView = {
    id,
    displayName,
    roleName,
    status,
    createdAt,
  };

  if (emailMasked) invite.emailMasked = emailMasked;
  if (phone) invite.phone = phone;
  if (expiresAt) invite.expiresAt = expiresAt;
  if (inviteeKindRaw === 'new' || inviteeKindRaw === 'existing') {
    invite.inviteeKind = inviteeKindRaw;
  }

  return { invite };
}

export function extractFamilyMemberInviteRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.invites)) return record.invites;
  return [];
}

export type NormalizeFamilyMemberInviteListOptions = {
  onDropped?: (reason: NormalizeFamilyInviteDropReason, raw: unknown) => void;
};

export function normalizeFamilyMemberInviteList(
  payload: unknown,
  options: NormalizeFamilyMemberInviteListOptions = {},
): MemberInviteView[] {
  return extractFamilyMemberInviteRows(payload)
    .map((row) => {
      const result = normalizeFamilyMemberInvite(row);
      if ('drop' in result) {
        options.onDropped?.(result.drop, row);
        return null;
      }
      return result.invite;
    })
    .filter((row): row is MemberInviteView => row !== null);
}
