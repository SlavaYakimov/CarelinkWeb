/**
 * Break / boundary specs for workspace-login flow.
 * Inputs: /tmp/e2e/workspace-login/{risks.md,happy.json,flow.md}
 */

describe('workspace login — break (guest)', () => {
  beforeEach(() => {
    cy.task('flushE2eRedis');
    cy.clearAllCookies();
  });

  it('renders login CardTitle as h3 (R-33)', () => {
    cy.visitLogin();
    cy.contains('h3', 'Вход в Carelink').should('be.visible');
  });

  it('uses Russian submit label on login button (R-34)', () => {
    cy.visitLogin();
    cy.contains('button', 'Войти').should('be.visible');
  });

  it('does not expose session material in login page HTML (R-38)', () => {
    cy.visitLogin();
    cy.document().its('documentElement.innerHTML').should('not.include', 'eyJ');
    cy.document().its('documentElement.innerHTML').should('not.include', 'deviceSession');
  });
});
