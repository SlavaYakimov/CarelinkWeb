Cypress.Commands.add('skipUnlessCompose', function skipUnlessCompose(this: Mocha.Context) {
  if (!Cypress.expose('E2E_COMPOSE')) {
    this.skip();
  }
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Cypress Chainable augmentation
  namespace Cypress {
    interface Chainable {
      skipUnlessCompose(): Chainable<void>;
    }
  }
}

export {};
