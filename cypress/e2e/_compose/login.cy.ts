/**
 * Workspace sign-in happy path (PLAN.md §6, screen 01 → /families, shortcut flow).
 * Requires CarelinkAuth compose BE-21, Redis, web BFF, CYPRESS_E2E_COMPOSE=1.
 *
 * Fixture: `cy.composeOnboardingCreateFamily` (fresh keeper + workspace).
 * Run: pnpm test:e2e:compose:login
 *
 * Production server only (`pnpm start`), not `pnpm dev`.
 */

function assertSessionCookiePresent() {
  cy.getCookies().should((cookies) => {
    const hasSid = cookies.some((c) => c.name === 'cl_sid' || c.name.endsWith('cl_sid'));
    if (!hasSid) {
      throw new Error('session cookie missing after sign-in');
    }
  });
}

function runWorkspaceSignInHappyPath(workspaceEmail: string, password: string) {
  // Keep trusted-device cookie from onboarding; only drop workspace session (recovery re-login pattern).
  cy.clearCarelinkCookie('cl_sid');

  cy.visit('/');
  cy.location('pathname').should('eq', '/login');
  cy.get('#workspaceSlug').should('be.visible');
  cy.get('#password').should('be.visible');

  cy.contains('h3', 'Вход в Carelink').should('be.visible');
  cy.contains('button', 'Войти').should('be.visible');
  cy.get('input[name="trustDevice"]').should('be.checked');

  cy.fillWorkspaceLogin(workspaceEmail, password);

  // Gateway sign-in + redirect can exceed default Cypress command timeout.
  cy.location('pathname', { timeout: 30_000 }).should('eq', '/families');
  assertSessionCookiePresent();
  cy.contains('h1', 'Мои семьи').should('be.visible');
}

describe('workspace sign-in (compose BE-21)', () => {
  before(function () {
    if (!Cypress.expose('E2E_COMPOSE')) {
      this.skip();
    }
  });

  it('lands on login from / and reaches /families with session cookie', () => {
    const ts = Date.now();
    cy.task('flushE2eRedis');

    cy.composeOnboardingCreateFamily(ts).then((family) => {
      runWorkspaceSignInHappyPath(family.workspaceEmail, family.password);
    });
  });
});
