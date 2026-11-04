export {};

declare global {
  namespace Cypress {
    interface Chainable {
      seedJoinFlow(flow: Record<string, unknown>): Chainable<void>;
    }
  }
}
