import type { components } from '@/server/gateway/types.gen';

export type MemberInviteStatus = components['schemas']['MemberInviteStatus'];

const LABELS: Record<MemberInviteStatus, string> = {
  sent: 'Отправлено',
  pending_accept: 'Ожидает принятия',
  accepted: 'Принято',
  declined: 'Отклонено',
  expired: 'Истекло',
  revoked: 'Отозвано',
};

const CANONICAL: MemberInviteStatus[] = [
  'sent',
  'pending_accept',
  'accepted',
  'declined',
  'expired',
  'revoked',
];

/** Map family-service status strings to OpenAPI MemberInviteStatus. */
export function normalizeMemberInviteStatus(raw: string | undefined): MemberInviteStatus {
  const value = (raw ?? 'sent').trim().toLowerCase();
  if (value === 'pending') return 'sent';
  if (CANONICAL.includes(value as MemberInviteStatus)) {
    return value as MemberInviteStatus;
  }
  return 'sent';
}

export function memberInviteStatusLabel(status: MemberInviteStatus | string): string {
  const normalized = typeof status === 'string' ? normalizeMemberInviteStatus(status) : status;
  return LABELS[normalized] ?? normalized;
}

export function inviteTerminalStatus(status: MemberInviteStatus | string): boolean {
  const normalized = typeof status === 'string' ? normalizeMemberInviteStatus(status) : status;
  return (
    normalized === 'accepted' ||
    normalized === 'declined' ||
    normalized === 'expired' ||
    normalized === 'revoked'
  );
}

export function inviteCanResendOrRevoke(status: MemberInviteStatus | string): boolean {
  const normalized = typeof status === 'string' ? normalizeMemberInviteStatus(status) : status;
  return normalized === 'sent' || normalized === 'pending_accept';
}
