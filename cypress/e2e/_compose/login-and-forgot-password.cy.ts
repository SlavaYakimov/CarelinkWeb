/**
 * Login → family recovery → confirm → /families → re-login (PLAN.md §6, screens 01, 29–30).
 * Requires CarelinkAuth compose BE-21, Redis, web BFF, CYPRESS_E2E_COMPOSE=1.
 *
 * Set CYPRESS_RECOVERY_PHONE_DIGITS (member phone, digits only).
 * Keeper approve: E2E_RECOVERY_KEEPER_WORKSPACE_EMAIL + E2E_RECOVERY_KEEPER_PASSWORD
 * (or E2E_RECOVERY_KEEPER_ACCESS_TOKEN). Run: pnpm test:e2e:compose:recovery
 */

describe('login and forgot password (family recovery, compose BE-21)', () => {
  before(function () {
    if (!Cypress.expose('E2E_COMPOSE')) {
      this.skip();
    }
  });

  it('completes workspace recovery happy path through re-login', () => {
    const ts = Date.now();
    const workspaceEmail = Cypress.expose('recoveryWorkspaceEmail') as string;
    const familySlug = workspaceEmail.split('@')[0] ?? 'yakimovs';
    const phoneDigits = Cypress.expose('recoveryPhoneDigits') as string;
    if (!phoneDigits) {
      throw new Error('Set CYPRESS_RECOVERY_PHONE_DIGITS for compose recovery');
    }

    const newPassword = `Testpass${ts}`;

    cy.task('flushE2eRedis');

    cy.visitLogin();
    cy.get('#workspaceSlug').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.contains('button', 'Войти').should('be.visible');

    cy.fillWorkspaceEmail(workspaceEmail);
    cy.get('#workspaceSlug').should('have.value', familySlug);
    cy.submitLoginExpectPasswordMinLength();

    cy.openLoginRecoveryFromForgotLink();

    cy.submitRecoveryRequest(familySlug, phoneDigits);
    cy.assertRecoverySentPage();

    cy.openRecoveryConfirmFromSent();

    cy.task<{ requestId: string }>('approveRecoveryRequest', { phoneDigits }).then(
      ({ requestId }) => {
        cy.task<string>('fetchOnboardingOtp', {
          channel: 'sms',
          to: phoneDigits,
          skipPriorMatches: 0,
        }).then((smsCode) => {
          cy.submitRecoveryConfirm(requestId, smsCode, newPassword);
          cy.location('pathname', { timeout: 30_000 }).should('eq', '/families');
        });
      },
    );

    cy.clearCarelinkCookie('cl_sid');
    cy.visitLogin();
    cy.fillWorkspaceLogin(workspaceEmail, newPassword);
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/families');
  });
});
