/**
 * Member invites compose negatives — E7, E9, E10, E11, E13, E15, E17 (placeholders).
 * Run with: pnpm test:e2e:compose:invites
 */

describe('invites compose negative / infra', () => {
  before(function () {
    cy.skipUnlessCompose();
  });

  it('E17: non-keeper create surfaces forbidden (smoke)', () => {
    cy.log('Requires seeded keeper + member sessions — extend when compose fixtures land');
  });
});
