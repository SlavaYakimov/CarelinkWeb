export {};

declare global {
  namespace Cypress {
    interface Chainable {
      fillOtp(code: string, firstInputId?: string): Chainable<void>;
      onboardingEnterEmail(email: string): Chainable<void>;
      onboardingEnterEmailOtp(code: string): Chainable<void>;
      onboardingEnterPhone(
        displayName: string,
        phoneDigits: string,
        smsCode: string,
      ): Chainable<void>;
      onboardingEnterDeviceSms(phoneDigits: string): Chainable<void>;
      onboardingEnterPassword(password: string): Chainable<void>;
      onboardingFinalizeWorkspace(workspaceSlug: string, displayName: string): Chainable<void>;
      clearCarelinkCookie(logical: 'cl_flow' | 'cl_sid'): Chainable<void>;
    }
  }
}
