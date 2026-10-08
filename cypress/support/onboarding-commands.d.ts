export {};

declare global {
  namespace Cypress {
    interface Chainable {
      fillOtp(code: string, firstInputId?: string): Chainable<void>;
      fillPhoneOtp(code: string): Chainable<void>;
      onboardingEnterEmail(email: string): Chainable<void>;
      onboardingEnterEmailOtp(code: string): Chainable<void>;
      onboardingEnterPhone(
        displayName: string,
        phoneDigits: string,
        smsCode: string,
      ): Chainable<void>;
      onboardingEnterDeviceSms(phoneDigits: string, smsOrdinal?: number): Chainable<void>;
      onboardingEnterPassword(password: string): Chainable<void>;
      onboardingFinalizeWorkspace(workspaceSlug: string, displayName: string): Chainable<void>;
      composeOnboardingCreateFamily(ts?: number): Chainable<{
        email: string;
        workspaceSlug: string;
        workspaceEmail: string;
        phoneDigits: string;
        password: string;
        displayName: string;
      }>;
      clearCarelinkCookie(logical: 'cl_flow' | 'cl_sid' | 'cl_did'): Chainable<void>;
      setCarelinkFlowCookie(fid: string, cookieName?: string): Chainable<void>;
      composeSignInViaSms(
        workspaceEmail: string,
        password: string,
        phoneDigits: string,
      ): Chainable<void>;
    }
  }
}
