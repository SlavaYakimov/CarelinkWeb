import { describe, expect, it } from 'vitest';
import {
  emailFieldSchema,
  familySlugSchema,
  otp6CodeSchema,
  phoneRawToE164,
  signInFormSchema,
  workspaceSlugFieldSchema,
} from '@/lib/forms/schemas';

describe('forms schemas', () => {
  it('accepts valid workspace slug', () => {
    expect(workspaceSlugFieldSchema.safeParse('my-family').success).toBe(true);
  });

  it('rejects slug starting with hyphen', () => {
    expect(workspaceSlugFieldSchema.safeParse('-bad').success).toBe(false);
  });

  it('sign-in requires password min 8', () => {
    const r = signInFormSchema.safeParse({ workspaceSlug: 'abc', password: 'short' });
    expect(r.success).toBe(false);
  });

  it('otp6 requires exactly six digits', () => {
    expect(otp6CodeSchema.safeParse('12345').success).toBe(false);
    expect(otp6CodeSchema.safeParse('123456').success).toBe(true);
  });

  it('email schema trims and validates', () => {
    expect(emailFieldSchema.safeParse('  a@b.co  ').success).toBe(true);
    expect(emailFieldSchema.safeParse('not-email').success).toBe(false);
  });

  it('family slug matches workspace rules', () => {
    expect(familySlugSchema.safeParse('family-1').success).toBe(true);
  });

  it('phoneRawToE164 normalizes RU numbers', () => {
    expect(phoneRawToE164('+7 (912) 345-67-89')).toBe('+79123456789');
    expect(phoneRawToE164('invalid')).toBeNull();
  });
});
