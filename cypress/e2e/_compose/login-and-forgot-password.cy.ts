/**
 * Login → family recovery → confirm → /families → re-login (PLAN.md §6, screens 01, 29–30).
 * Requires CarelinkAuth compose BE-21, Redis, web BFF, CYPRESS_E2E_COMPOSE=1.
 *
 * Fixture: without CYPRESS_RECOVERY_PHONE_DIGITS runs onboarding first (keeper = new family).
 * Or set CYPRESS_RECOVERY_PHONE_DIGITS + E2E_RECOVERY_KEEPER_* for existing family (e.g. yakimovs).
 * Run: pnpm test:e2e:compose:recovery
 */

type RecoveryFixture = {
  workspaceEmail: string;
  familySlug: string;
  phoneDigits: string;
  keeperWorkspaceEmail: string;
  keeperPassword: string;
};

function runRecoveryHappyPath(
  fixture: RecoveryFixture,
  newPassword: string,
  keeperOverride?: { keeperWorkspaceEmail: string; keeperPassword: string },
) {
  const { workspaceEmail, familySlug, phoneDigits } = fixture;

  cy.task('flushE2eRedis');

  cy.visitLogin();
  cy.fillWorkspaceEmail(workspaceEmail);
  cy.get('#workspaceSlug').should('have.value', familySlug);
  cy.submitLoginExpectPasswordMinLength();

  cy.openLoginRecoveryFromForgotLink();

  cy.submitRecoveryRequest(familySlug, phoneDigits);
  cy.assertRecoverySentPage();

  cy.openRecoveryConfirmFromSent();

  cy.task<{ requestId: string; smsCode: string }>('approveRecoveryRequest', {
    phoneDigits,
    ...keeperOverride,
  }).then(({ requestId, smsCode }) => {
    cy.submitRecoveryConfirm(requestId, smsCode, newPassword);
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/families');
  });

  cy.clearCarelinkCookie('cl_sid');
  cy.visitLogin();
  cy.fillWorkspaceLogin(workspaceEmail, newPassword);
  cy.location('pathname', { timeout: 30_000 }).should('eq', '/families');
}

describe('login and forgot password (family recovery, compose BE-21)', () => {
  before(function () {
    if (!Cypress.expose('E2E_COMPOSE')) {
      this.skip();
    }
  });

  it('completes workspace recovery happy path through re-login', () => {
    const ts = Date.now();
    const newPassword = `Testpass${ts}`;
    const envPhone = Cypress.expose('recoveryPhoneDigits') as string;
    const envWorkspace = Cypress.expose('recoveryWorkspaceEmail') as string;

    if (envPhone) {
      const familySlug = envWorkspace.split('@')[0] ?? 'yakimovs';
      runRecoveryHappyPath(
        {
          workspaceEmail: envWorkspace,
          familySlug,
          phoneDigits: envPhone,
          keeperWorkspaceEmail: envWorkspace,
          keeperPassword: '',
        },
        newPassword,
      );
      return;
    }

    cy.composeOnboardingCreateFamily(ts).then((family) => {
      runRecoveryHappyPath(
        {
          workspaceEmail: family.workspaceEmail,
          familySlug: family.workspaceSlug,
          phoneDigits: family.phoneDigits,
          keeperWorkspaceEmail: family.workspaceEmail,
          keeperPassword: family.password,
        },
        newPassword,
        {
          keeperWorkspaceEmail: family.workspaceEmail,
          keeperPassword: family.password,
        },
      );
    });
  });
});
