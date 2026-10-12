/**
 * Member invites compose — E1, E2, E4, E5, E12 (matrix subset).
 * Requires CarelinkAuth compose + WORKSPACE_MEMBER_INVITE_EMAIL_ENABLED.
 *
 * Run: pnpm test:e2e:compose:invites
 */

describe('invites compose happy path', () => {
  before(function () {
    cy.skipUnlessCompose();
  });

  beforeEach(() => {
    cy.task('flushE2eRedis');
  });

  it('E12: public /invite saves flow and redirects to login', () => {
    cy.visit('/invite?code=e2ecomposecode12345');
    cy.contains('button', 'Войти').click();
    cy.location('pathname').should('eq', '/login');
    cy.location('search').should('include', 'next=%2Finvites');
  });
});
