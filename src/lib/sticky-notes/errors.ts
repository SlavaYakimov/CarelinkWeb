import { getErrorMessage } from '@/lib/messages';

export const STICKY_NOTE_FAMILY_KEY_MESSAGE =
  'Ключ семьи для записок ещё не настроен. OPEN SN-OQ-1 — нужен протокол выдачи ключа.';

export const STICKY_NOTE_DAILY_LIMIT_MESSAGE =
  'Сегодня можно отправить не больше 10 записок. Попробуйте завтра.';

export const STICKY_NOTE_RESTRICTED_SESSION_MESSAGE =
  'В этом режиме сессии нельзя отправлять или читать записки.';

export const STICKY_NOTE_SELF_RECIPIENT_MESSAGE = 'Нельзя отправить записку самому себе.';

export const STICKY_NOTE_IDEMPOTENCY_CONFLICT_MESSAGE =
  'Эта записка уже отправлена с другим содержимым. Создайте новую.';

export function getStickyNoteErrorMessage(code: string, retryAfter?: number): string {
  if (code === 'FAMILY_CONTENT_KEY_UNAVAILABLE') return STICKY_NOTE_FAMILY_KEY_MESSAGE;
  if (code === 'RESTRICTED_SESSION') return STICKY_NOTE_RESTRICTED_SESSION_MESSAGE;
  if (code === 'FORBIDDEN') return getErrorMessage('FORBIDDEN');
  if (code === 'NOT_FOUND') return getErrorMessage('NOT_FOUND');
  if (code === 'BAD_REQUEST') return STICKY_NOTE_SELF_RECIPIENT_MESSAGE;
  if (code === 'IDEMPOTENCY_CONFLICT') return STICKY_NOTE_IDEMPOTENCY_CONFLICT_MESSAGE;
  if (code === 'SERVICE_UNAVAILABLE') return getErrorMessage('OFFLINE');
  if (code === 'RATE_LIMIT' || code === 'STICKY_NOTE_DAILY_LIMIT') {
    if (retryAfter != null && retryAfter > 0) {
      return `${STICKY_NOTE_DAILY_LIMIT_MESSAGE} Повтор через ${retryAfter} с.`;
    }
    return STICKY_NOTE_DAILY_LIMIT_MESSAGE;
  }
  if (code === 'OFFLINE' || code === 'UNKNOWN' || code === 'INTERNAL') {
    return getErrorMessage('OFFLINE');
  }
  return getErrorMessage(code);
}
