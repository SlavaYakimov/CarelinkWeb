import { z } from 'zod';
import { getValidationMessage } from '@/lib/messages';
import { isPasswordStrongEnough } from '@/lib/password-rules';
import { normalizeRuPhone } from '@/lib/phone';
import { isValidWorkspaceSlug, normalizeWorkspaceSlug } from '@/lib/workspace-slug';

const slugFormatMessage = 'Только латиница, цифры и дефис, от 3 до 32 символов';

export const workspaceSlugFieldSchema = z
  .string()
  .trim()
  .min(3, 'Адрес семьи не короче 3 символов')
  .max(32, 'Слишком длинный адрес')
  .refine((v) => /^[a-z0-9-]+$/i.test(v), 'Только латиница, цифры и дефис')
  .refine((v) => isValidWorkspaceSlug(v), slugFormatMessage);

export const workspaceSlugRequiredSchema = z
  .string()
  .min(1, 'Укажите адрес семьи')
  .pipe(workspaceSlugFieldSchema);

export const familySlugSchema = z
  .string()
  .trim()
  .min(3, 'Адрес семьи не короче 3 символов')
  .max(32, 'Слишком длинный адрес')
  .regex(/^[a-z0-9-]+$/, 'Только латиница, цифры и дефис')
  .refine((v) => isValidWorkspaceSlug(v), slugFormatMessage);

export const signInFormSchema = z.object({
  workspaceSlug: workspaceSlugRequiredSchema,
  password: z.string().min(8, 'Не короче 8 символов'),
  trustDevice: z
    .union([z.literal('on'), z.literal('true'), z.literal('1'), z.undefined()])
    .optional(),
  next: z.string().optional(),
});

export const emailFieldSchema = z.string().trim().email('Укажите корректную почту').max(254);

export const emailFormSchema = z.object({
  email: emailFieldSchema,
});

/** Client-only gate for onboarding step 1 (152-ФЗ consent until BE field exists). */
export const onboardingEmailConsentGateSchema = emailFormSchema.extend({
  personalDataConsent: z.boolean().refine((value) => value, {
    message: 'Подтвердите согласие на обработку персональных данных',
  }),
});

export const otp6CodeSchema = z.string().regex(/^\d{6}$/, getValidationMessage('otpIncomplete'));

export const emailOtpFormSchema = z.object({
  email: z.string().email(),
  code: otp6CodeSchema,
});

export const phoneRawSchema = z.string().min(1, 'Укажите номер телефона');

export const phoneFormSchema = z.object({
  phone: phoneRawSchema,
});

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Укажите, как к вам обращаться')
  .max(64, 'Слишком длинное имя');

export const onboardingPhoneFormSchema = z.object({
  phone: phoneRawSchema,
  displayName: displayNameSchema,
});

export const otpFormSchema = z.object({
  code: otp6CodeSchema,
});

export const familyDisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'Укажите название семьи')
  .max(64, 'Слишком длинное название');

export const createFamilyFormSchema = z.object({
  name: familyDisplayNameSchema,
});

export const passwordPairFormSchema = z
  .object({
    newPassword: z.string().min(8, 'Не короче 8 символов'),
    confirmPassword: z.string().min(8),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  .refine((v) => isPasswordStrongEnough(v.newPassword), {
    message: 'Пароль не соответствует требованиям',
    path: ['newPassword'],
  });

const changePasswordCoreSchema = z.object({
  oldPassword: z.string().min(8, 'Не короче 8 символов'),
  newPassword: z.string().min(8, 'Не короче 8 символов'),
  confirmPassword: z.string().min(8),
});

const changePasswordMatchAndStrength = <S extends z.ZodTypeAny>(schema: S) =>
  schema
    .refine((v: z.infer<S>) => v.newPassword === v.confirmPassword, {
      message: 'Пароли не совпадают',
      path: ['confirmPassword'],
    })
    .refine((v: z.infer<S>) => isPasswordStrongEnough(v.newPassword), {
      message: 'Пароль не соответствует требованиям',
      path: ['newPassword'],
    });

export const changePasswordClientSchema = changePasswordMatchAndStrength(changePasswordCoreSchema);

export const changePasswordFormSchema = changePasswordMatchAndStrength(
  changePasswordCoreSchema.extend({ next: z.string().optional() }),
);

export const recoveryRequestFormSchema = z.object({
  familySlug: familySlugSchema,
  phone: phoneRawSchema,
});

export const requestIdFieldSchema = z
  .string()
  .trim()
  .min(1, 'Укажите идентификатор из SMS')
  .max(64)
  .regex(/^[A-Za-z0-9-]+$/, 'Неверный формат идентификатора');

export const recoveryConfirmFormSchema = z.object({
  requestId: requestIdFieldSchema,
  code: otp6CodeSchema,
  newPassword: z.string().min(8, 'Не короче 8 символов'),
  confirmPassword: z.string().min(8),
});

export const recoveryConfirmClientSchema = recoveryConfirmFormSchema
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  .refine((v) => isPasswordStrongEnough(v.newPassword), {
    message: 'Пароль не соответствует требованиям',
    path: ['newPassword'],
  });

export const onboardingWorkspaceFormSchema = z.object({
  workspaceSlug: z
    .string()
    .min(3, 'Не короче 3 символов')
    .max(32)
    .refine((v) => isValidWorkspaceSlug(v), slugFormatMessage),
  displayName: familyDisplayNameSchema,
});

/** Validates raw phone input and returns E.164 or null. */
export function phoneRawToE164(raw: string): string | null {
  return normalizeRuPhone(raw);
}

export const phoneE164FormSchema = phoneFormSchema.refine((v) => Boolean(phoneRawToE164(v.phone)), {
  message: getValidationMessage('phoneInvalid'),
  path: ['phone'],
});

export const recoveryRequestClientSchema = recoveryRequestFormSchema.refine(
  (v) => Boolean(phoneRawToE164(v.phone)),
  { message: getValidationMessage('phoneInvalid'), path: ['phone'] },
);

export const onboardingPhoneClientSchema = onboardingPhoneFormSchema.refine(
  (v) => Boolean(phoneRawToE164(v.phone)),
  { message: getValidationMessage('phoneInvalid'), path: ['phone'] },
);

export function normalizeSlugInput(raw: string): string {
  return normalizeWorkspaceSlug(raw);
}

export const inviteIdSchema = z.string().uuid('Неверный идентификатор приглашения');

export const memberInviteFormSchema = z.object({
  displayName: displayNameSchema,
  personalEmail: emailFieldSchema,
  phone: phoneRawSchema,
  roleTemplateId: z.string().uuid('Выберите роль'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const memberInviteClientSchema = memberInviteFormSchema.refine(
  (v) => Boolean(phoneRawToE164(v.phone)),
  { message: getValidationMessage('phoneInvalid'), path: ['phone'] },
);

export const lookupInviteEmailSchema = z.object({
  email: emailFieldSchema,
});

export { isValidWorkspaceSlug, normalizeWorkspaceSlug };
