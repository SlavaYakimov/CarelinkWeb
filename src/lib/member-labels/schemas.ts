import { z } from 'zod';
import { MEMBER_LABEL_MAX_TARGETS, MEMBER_LABEL_MAX_TEXT } from '@/lib/member-labels/constants';

export const memberLabelTextSchema = z
  .string()
  .trim()
  .min(1, 'Введите текст метки')
  .max(MEMBER_LABEL_MAX_TEXT, `Не больше ${MEMBER_LABEL_MAX_TEXT} символов`);

export const assignMemberLabelsSchema = z.object({
  familyId: z.string().uuid(),
  labelText: memberLabelTextSchema,
  targetUserIds: z
    .array(z.string().uuid())
    .min(1, 'Выберите хотя бы одного участника')
    .max(MEMBER_LABEL_MAX_TARGETS, `Можно выбрать не больше ${MEMBER_LABEL_MAX_TARGETS}`),
});
