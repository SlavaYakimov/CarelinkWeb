import type { GatewayError } from '@/server/gateway/errors';

/** UI reasons for keeper delegate-link / approve / reject failures (CarelinkAuth #165). */
export type DelegateUnavailableReason = 'expired' | 'handled' | 'closed' | 'bad-request';

export function delegateUnavailablePath(reason: DelegateUnavailableReason): string {
  return `/delegate/unavailable?reason=${reason}`;
}

const COPY: Record<DelegateUnavailableReason, { title: string; description: string }> = {
  expired: {
    title: 'Ссылка недействительна или истекла',
    description:
      'Запрос на подтверждение входа больше нельзя открыть по этой ссылке. Попросите участника начать вход заново.',
  },
  handled: {
    title: 'Запрос уже обработан',
    description:
      'Вы уже подтвердили или отклонили этот вход. Новое действие по этой ссылке не требуется.',
  },
  closed: {
    title: 'Запрос на вход уже закрыт',
    description:
      'Участник уже завершил вход другим способом, или ожидание было отменено. Действие по ссылке недоступно.',
  },
  'bad-request': {
    title: 'Ссылка повреждена',
    description: 'Проверьте, что вы открыли ссылку из уведомления целиком, без обрезанного адреса.',
  },
};

export function delegateUnavailableCopy(reason: DelegateUnavailableReason): {
  title: string;
  description: string;
} {
  return COPY[reason];
}

export function parseDelegateUnavailableReason(
  raw: string | undefined,
): DelegateUnavailableReason | null {
  if (raw === 'expired' || raw === 'handled' || raw === 'closed' || raw === 'bad-request') {
    return raw;
  }
  return null;
}

/**
 * Maps gateway errors for delegate-details / approve / reject.
 * Does not treat INVALID_OTP as delegate expiry (SMS-only).
 */
export function mapDelegateGatewayError(
  err: GatewayError,
): DelegateUnavailableReason | 'forbidden' | 'login' | null {
  if (err.code === 'INVALID_OTP') return null;

  if (err.code === 'DELEGATE_NOT_ALLOWED' || err.code === 'FORBIDDEN') return 'forbidden';
  if (err.code === 'UNAUTHORIZED') return 'login';

  if (err.code === 'DELEGATE_EXPIRED' || err.status === 410) return 'expired';
  if (err.code === 'CONFLICT' || err.code === 'ALREADY_EXISTS' || err.status === 409) {
    return 'handled';
  }
  if (err.code === 'NOT_FOUND' || err.status === 404) return 'closed';
  if (err.code === 'BAD_REQUEST' || err.status === 400) return 'bad-request';

  return null;
}
