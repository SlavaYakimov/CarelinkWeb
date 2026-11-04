import { describe, expect, it } from 'vitest';
import {
  recoveryConfirmClientSchema,
  recoveryRequestClientSchema,
  phoneRawToE164,
  signInFormSchema,
} from '@/lib/forms/schemas';
import { formatRuPhoneDisplay } from '@/lib/phone';

/** Mirrors composeOnboardingCreateFamily fixture shape. */
function composeFamilyFixture(ts = 1_731_234_567_890) {
  const workspaceSlug = `e2e${ts.toString(36).slice(-8)}`;
  const phoneDigits = `900${String(ts).slice(-7)}`;
  const password = 'Testpass1';
  const newPassword = `Testpass${ts}`;
  return { workspaceSlug, phoneDigits, password, newPassword };
}

describe('recovery compose gate fixtures', () => {
  it('recovery request gate accepts family slug and compose phone digits', () => {
    const { workspaceSlug, phoneDigits } = composeFamilyFixture();
    const display = formatRuPhoneDisplay(phoneDigits);
    const e164 = phoneRawToE164(display);
    expect(e164).toMatch(/^\+7\d{10}$/);

    const withDisplay = recoveryRequestClientSchema.safeParse({
      familySlug: workspaceSlug,
      phone: display,
    });
    expect(withDisplay.success).toBe(true);

    const withE164 = recoveryRequestClientSchema.safeParse({
      familySlug: workspaceSlug,
      phone: e164!,
    });
    expect(withE164.success).toBe(true);
  });

  it('recovery confirm gate accepts keeper-approved ids and compose new password', () => {
    const { newPassword } = composeFamilyFixture();
    const requestId = '00000000-0000-4000-8000-000000000001';
    const smsCode = '123456';

    const parsed = recoveryConfirmClientSchema.safeParse({
      requestId,
      code: smsCode,
      newPassword,
      confirmPassword: newPassword,
    });
    expect(parsed.success).toBe(true);
  });

  it('sign-in gate accepts compose new password after recovery', () => {
    const { workspaceSlug, newPassword } = composeFamilyFixture();
    const parsed = signInFormSchema.safeParse({
      workspaceSlug,
      password: newPassword,
    });
    expect(parsed.success).toBe(true);
  });
});
