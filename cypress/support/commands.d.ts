export {};

declare global {
  namespace Cypress {
    interface Chainable {
      visitLogin(): Chainable<void>;
      fillWorkspaceLogin(email: string, password: string): Chainable<void>;
    }
  }
}
