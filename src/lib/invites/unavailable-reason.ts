export type InviteUnavailableReason =
  | 'not_invitee'
  | 'expired'
  | 'revoked'
  | 'not_pending'
  | 'not_found'
  | 'invalid_code'
  | 'already_member';

export function parseInviteUnavailableReason(
  raw: string | null | undefined,
): InviteUnavailableReason {
  switch (raw) {
    case 'not_invitee':
    case 'expired':
    case 'revoked':
    case 'not_pending':
    case 'not_found':
    case 'invalid_code':
    case 'already_member':
      return raw;
    default:
      return 'not_found';
  }
}

export function inviteUnavailableCopy(reason: InviteUnavailableReason): {
  title: string;
  description: string;
} {
  switch (reason) {
    case 'not_invitee':
      return {
        title: 'Приглашение адресовано другому',
        description: 'Войдите под учётной записью, на которую отправили приглашение.',
      };
    case 'expired':
      return {
        title: 'Приглашение истекло',
        description: 'Попросите хранителя семьи отправить приглашение заново.',
      };
    case 'revoked':
      return {
        title: 'Приглашение отозвано',
        description: 'Хранитель отменил это приглашение.',
      };
    case 'not_pending':
      return {
        title: 'Приглашение уже обработано',
        description: 'Это приглашение принято, отклонено или больше не действует.',
      };
    case 'invalid_code':
      return {
        title: 'Ссылка недействительна',
        description: 'Проверьте ссылку из письма или попросите хранителя отправить новую.',
      };
    case 'already_member':
      return {
        title: 'Вы уже в этой семье',
        description: 'Откройте список семей — семья уже доступна в вашем аккаунте.',
      };
    case 'not_found':
    default:
      return {
        title: 'Приглашение не найдено',
        description: 'Возможно, ссылка устарела или приглашение уже использовано.',
      };
  }
}
