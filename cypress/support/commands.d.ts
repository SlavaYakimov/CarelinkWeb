export {};

declare global {
  namespace Cypress {
    interface Chainable {
      visitLogin(): Chainable<void>;
      fillWorkspaceLogin(email: string, password: string): Chainable<void>;
      injectAxe(): Chainable<void>;
      checkA11y(context?: string | Node, options?: Record<string, unknown>): Chainable<void>;
      assertGatedValidation(options: {
        submitLabel: string;
        errorText: string;
        blurSelector: string;
      }): Chainable<void>;
      clickSubmitWhenEnabled(label: string | RegExp): Chainable<void>;
    }
  }
}
