export {};

declare global {
  namespace Cypress {
    interface Chainable {
      fillWorkspaceEmail(email: string): Chainable<void>;
      submitLoginExpectPasswordMinLength(): Chainable<void>;
      openLoginRecoveryFromForgotLink(): Chainable<void>;
      submitRecoveryRequest(familySlug: string, phoneDigits: string): Chainable<void>;
      assertRecoverySentPage(): Chainable<void>;
      openRecoveryConfirmFromSent(): Chainable<void>;
      submitRecoveryConfirm(
        requestId: string,
        otpCode: string,
        newPassword: string,
      ): Chainable<void>;
    }
  }
}
