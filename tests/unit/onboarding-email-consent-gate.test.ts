import { describe, it, expect } from 'vitest';
import { onboardingEmailConsentGateSchema } from '@/lib/forms/schemas';

describe('onboardingEmailConsentGateSchema', () => {
  it('requires personal data consent with valid email', () => {
    expect(
      onboardingEmailConsentGateSchema.safeParse({
        email: 'user@example.com',
        personalDataConsent: false,
      }).success,
    ).toBe(false);
    expect(
      onboardingEmailConsentGateSchema.safeParse({
        email: 'user@example.com',
        personalDataConsent: true,
      }).success,
    ).toBe(true);
  });
});
