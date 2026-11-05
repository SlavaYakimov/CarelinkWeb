import { getErrorMessage } from '@/lib/messages';
import { MEMBER_LABEL_MAX_ACTIVE_PER_USER } from '@/lib/member-labels/constants';

export const MEMBER_LABEL_SELECTION_LIMIT_MESSAGE = 'Можно выбрать не больше 10 участников за раз.';

export function getMemberLabelErrorMessage(code: string): string {
  if (code === 'MEMBER_LABEL_LIMIT') {
    return `У участника уже ${MEMBER_LABEL_MAX_ACTIVE_PER_USER} активных меток.`;
  }
  if (code === 'MEMBER_LABEL_BATCH_FAILED') {
    return 'Не удалось назначить метку части участников. См. список ниже.';
  }
  if (code === 'FORBIDDEN') return getErrorMessage('FORBIDDEN');
  if (code === 'RESTRICTED_SESSION') {
    return 'В этом режиме сессии нельзя назначать метки.';
  }
  return getErrorMessage(code);
}

export type MemberLabelBatchFailureItem = {
  userId: string;
  reason: string;
};
