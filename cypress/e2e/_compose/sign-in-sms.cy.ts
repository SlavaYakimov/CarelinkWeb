/**
 * Full workspace sign-in with SMS device verification (PLAN.md §6, screen 07).
 * Requires CarelinkAuth compose BE-21, CYPRESS_E2E_COMPOSE=1, production server (pnpm start).
 *
 * Run: pnpm test:e2e:compose:sign-in-sms
 */

describe('sign-in new device via SMS (compose BE-21)', () => {
  before(function () {
    if (!Cypress.expose('E2E_COMPOSE')) {
      this.skip();
    }
  });

  it('completes workspace login and reaches /families', () => {
    const ts = Date.now();
    cy.task('flushE2eRedis');

    cy.composeOnboardingCreateFamily(ts).then((family) => {
      cy.composeSignInViaSms(family.workspaceEmail, family.password, family.phoneDigits);
    });
  });
});
