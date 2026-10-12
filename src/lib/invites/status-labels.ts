import type { components } from '@/server/gateway/types.gen';

type Status = components['schemas']['MemberInviteStatus'];

const LABELS: Record<Status, string> = {
  sent: 'Отправлено',
  pending_accept: 'Ожидает принятия',
  accepted: 'Принято',
  declined: 'Отклонено',
  expired: 'Истекло',
  revoked: 'Отозвано',
};

export function memberInviteStatusLabel(status: Status): string {
  return LABELS[status] ?? status;
}

export function inviteTerminalStatus(status: Status): boolean {
  return (
    status === 'accepted' || status === 'declined' || status === 'expired' || status === 'revoked'
  );
}

export function inviteCanResendOrRevoke(status: Status): boolean {
  return status === 'sent' || status === 'pending_accept';
}
