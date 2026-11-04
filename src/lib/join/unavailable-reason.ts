export type JoinUnavailableReason = 'already_in_family' | 'expired' | 'invalid_token';

export function parseJoinUnavailableReason(raw: string | null | undefined): JoinUnavailableReason {
  switch (raw) {
    case 'already_in_family':
    case 'expired':
    case 'invalid_token':
      return raw;
    default:
      return 'expired';
  }
}

export function joinUnavailableCopy(reason: JoinUnavailableReason): {
  title: string;
  description: string;
} {
  switch (reason) {
    case 'already_in_family':
      return {
        title: 'Вы уже в другой семье',
        description:
          'Чтобы принять это приглашение, сначала выйдите из текущей семьи. Если нужна помощь — напишите в поддержку.',
      };
    case 'invalid_token':
      return {
        title: 'Ссылка недействительна',
        description: 'Проверьте QR или попросите хранителя отправить новое приглашение.',
      };
    case 'expired':
    default:
      return {
        title: 'Приглашение устарело',
        description: 'Попросите хранителя отправить новое QR-приглашение или ссылку.',
      };
  }
}
