import { getErrorMessage } from '@/lib/messages';
import { MEMBER_LABEL_MAX_ACTIVE_PER_USER } from '@/lib/member-labels/constants';

export const MEMBER_LABEL_SELECTION_LIMIT_MESSAGE = 'Можно выбрать не больше 10 участников за раз.';

const REJECTION_MESSAGES: Record<string, string> = {
  not_member: 'Участник не в этой семье.',
  child_role: 'Нельзя назначить метку участнику с детской ролью.',
  restricted_role: 'Роль участника не позволяет метки.',
  label_exists: 'Такая метка уже есть.',
  max_labels: `У участника уже ${MEMBER_LABEL_MAX_ACTIVE_PER_USER} активных меток.`,
};

export function getMemberLabelRejectionMessage(reason: string): string {
  return REJECTION_MESSAGES[reason] ?? reason;
}

export function getMemberLabelErrorMessage(code: string): string {
  if (code === 'BAD_REQUEST') {
    return 'Не удалось назначить метку части участников. См. список ниже.';
  }
  if (code === 'FORBIDDEN') return getErrorMessage('FORBIDDEN');
  if (code === 'RESTRICTED_SESSION') {
    return 'В этом режиме сессии нельзя назначать метки.';
  }
  if (code === 'NOT_FOUND') return getErrorMessage('NOT_FOUND');
  return getErrorMessage(code);
}

export type MemberLabelBatchFailureItem = {
  userId: string;
  reason: string;
};
