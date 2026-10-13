import { getErrorMessage } from '@/lib/messages';

/** Screen 17 — lookup/create when family-service returns NOT_IMPLEMENTED (501). */
export const INVITE_EMAIL_NOT_AVAILABLE_MESSAGE = 'Приглашения по почте временно недоступны';

export const INVITE_RATE_LIMIT_MESSAGE = 'Слишком много проверок почты. Попробуйте позже';

export function getInviteErrorMessage(code: string): string {
  if (code === 'NOT_IMPLEMENTED') {
    return INVITE_EMAIL_NOT_AVAILABLE_MESSAGE;
  }
  if (code === 'RATE_LIMIT') {
    return INVITE_RATE_LIMIT_MESSAGE;
  }
  return getErrorMessage(code);
}
