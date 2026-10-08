/**
 * Negative / boundary: workspace sign-in with CarelinkAuth compose (BE-21).
 * Run: pnpm test:e2e:compose:login with extra spec or CYPRESS_E2E_COMPOSE=1.
 */

function runComposeSignIn(workspaceEmail: string, password: string) {
  cy.clearCarelinkCookie('cl_sid');
  cy.visitLogin();
  cy.fillWorkspaceLogin(workspaceEmail, password);
  cy.location('pathname', { timeout: 30_000 }).should('eq', '/families');
  cy.getCookies().should((cookies) => {
    const hasSid = cookies.some((c) => c.name === 'cl_sid' || c.name.endsWith('cl_sid'));
    expect(hasSid).to.eq(true);
  });
}

describe('workspace login — negative (compose BE-21)', () => {
  before(function () {
    if (!Cypress.expose('E2E_COMPOSE')) {
      this.skip();
    }
  });

  beforeEach(() => {
    cy.task('flushE2eRedis');
    cy.clearAllCookies();
  });

  it('redirects /login to app when session already active (R-8)', () => {
    const ts = Date.now();
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      runComposeSignIn(family.workspaceEmail, family.password);
      cy.visit('/login');
      cy.location('pathname', { timeout: 15_000 }).should('eq', '/families');
    });
  });

  it('sets session cookie before families redirect completes (R-3)', () => {
    const ts = Date.now();
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      cy.clearCarelinkCookie('cl_sid');
      cy.visitLogin();
      cy.get('#workspaceSlug')
        .clear()
        .type(family.workspaceEmail.split('@')[0] ?? '');
      cy.get('#password').clear().type(family.password, { log: false });
      cy.contains('button', 'Войти').click();
      cy.getCookies().should((cookies) => {
        const hasSid = cookies.some((c) => c.name === 'cl_sid' || c.name.endsWith('cl_sid'));
        expect(hasSid).to.eq(true);
      });
      cy.location('pathname', { timeout: 30_000 }).should('eq', '/families');
    });
  });

  it('redirects browser back from /login to app when session exists (R-9)', () => {
    const ts = Date.now();
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      runComposeSignIn(family.workspaceEmail, family.password);
      cy.visit('/login');
      cy.location('pathname', { timeout: 15_000 }).should('eq', '/families');
      cy.go('back');
      cy.location('pathname', { timeout: 15_000 }).should('not.eq', '/login');
    });
  });

  it('allows second workspace login after clearing session cookie (R-23)', () => {
    const ts = Date.now();
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      runComposeSignIn(family.workspaceEmail, family.password);
      cy.clearCarelinkCookie('cl_sid');
      runComposeSignIn(family.workspaceEmail, family.password);
    });
  });

  it('keeps user on /families on repeat visit after sign-in (R-24)', () => {
    const ts = Date.now();
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      runComposeSignIn(family.workspaceEmail, family.password);
      cy.visit('/families');
      cy.location('pathname', { timeout: 15_000 }).should('eq', '/families');
    });
  });

  it('routes to device verification when trust device is unchecked (R-13)', () => {
    const ts = Date.now();
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      cy.clearCarelinkCookie('cl_sid');
      cy.clearCarelinkCookie('cl_did');
      cy.visitLogin();
      cy.get('input[name="trustDevice"]').uncheck();
      cy.fillWorkspaceLogin(family.workspaceEmail, family.password);
      cy.location('pathname', { timeout: 45_000 }).should('match', /^\/login\/verify-(phone|sms|keeper)/);
      cy.location('pathname').should('not.eq', '/families');
    });
  });

  it('does not dead-end on verify-push when device verification required (R-3)', () => {
    const ts = Date.now();
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      cy.clearCarelinkCookie('cl_sid');
      cy.clearCarelinkCookie('cl_did');
      cy.visitLogin();
      cy.get('input[name="trustDevice"]').uncheck();
      cy.fillWorkspaceLogin(family.workspaceEmail, family.password);
      cy.location('pathname', { timeout: 45_000 }).should('match', /^\/login\/verify-(phone|sms|keeper)/);
      cy.location('pathname').should('not.eq', '/login');
      cy.location('pathname').then((pathname) => {
        if (pathname === '/login/verify-sms') {
          cy.contains('h3', 'Введите код из SMS').should('be.visible');
        }
      });
    });
  });

});
