import { describe, expect, it } from 'vitest';
import {
  changePasswordClientSchema,
  createFamilyFormSchema,
  emailFormSchema,
  onboardingWorkspaceFormSchema,
  otpFormSchema,
  passwordPairFormSchema,
  recoveryConfirmClientSchema,
  phoneRawToE164,
  recoveryRequestClientSchema,
  signInFormSchema,
} from '@/lib/forms/schemas';

function schemaOk<S extends { safeParse: (v: unknown) => { success: boolean } }>(
  schema: S,
  values: unknown,
): boolean {
  return schema.safeParse(values).success;
}

describe('form matrix client schemas (audit §3.1 gating)', () => {
  it('login', () => {
    expect(schemaOk(signInFormSchema, { workspaceSlug: 'family-1', password: 'longenough' })).toBe(
      true,
    );
    expect(schemaOk(signInFormSchema, { workspaceSlug: 'ab', password: 'longenough' })).toBe(false);
  });

  it('onboarding email', () => {
    expect(schemaOk(emailFormSchema, { email: 'a@b.co' })).toBe(true);
    expect(schemaOk(emailFormSchema, { email: 'bad' })).toBe(false);
  });

  it('onboarding workspace', () => {
    expect(
      schemaOk(onboardingWorkspaceFormSchema, {
        workspaceSlug: 'my-family',
        displayName: 'Name',
      }),
    ).toBe(true);
  });

  it('onboarding password pair', () => {
    expect(
      schemaOk(passwordPairFormSchema, {
        newPassword: 'Validpass1',
        confirmPassword: 'Validpass1',
      }),
    ).toBe(true);
  });

  it('create family (/families/new)', () => {
    expect(schemaOk(createFamilyFormSchema, { name: 'Новая семья' })).toBe(true);
    expect(schemaOk(createFamilyFormSchema, { name: '' })).toBe(false);
  });

  it('recovery request', () => {
    const phone = '+79123456789';
    expect(
      schemaOk(recoveryRequestClientSchema, {
        familySlug: 'family-1',
        phone,
      }),
    ).toBe(true);
    expect(phoneRawToE164('9001234567')).toBeTruthy();
  });

  it('recovery confirm', () => {
    expect(
      schemaOk(recoveryConfirmClientSchema, {
        requestId: 'req-1',
        code: '123456',
        newPassword: 'Validpass1',
        confirmPassword: 'Validpass1',
      }),
    ).toBe(true);
    expect(
      schemaOk(recoveryConfirmClientSchema, {
        requestId: 'req-1',
        code: '12345',
        newPassword: 'Validpass1',
        confirmPassword: 'Validpass1',
      }),
    ).toBe(false);
  });

  it('change password', () => {
    expect(
      schemaOk(changePasswordClientSchema, {
        oldPassword: 'temp-pass1',
        newPassword: 'Validpass1',
        confirmPassword: 'Validpass1',
      }),
    ).toBe(true);
  });

  it('otp step', () => {
    expect(schemaOk(otpFormSchema, { code: '123456' })).toBe(true);
    expect(schemaOk(otpFormSchema, { code: '12345' })).toBe(false);
  });
});
