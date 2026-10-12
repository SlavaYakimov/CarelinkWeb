describe('App shell mobile chrome', () => {
  beforeEach(() => {
    cy.viewport(375, 812);
  });

  it('does not show app burger on public login', () => {
    cy.visit('/login');
    cy.injectAxe();
    cy.get('[aria-label="Открыть меню"]').should('not.exist');
    cy.checkA11y(undefined, {
      includedImpacts: ['serious', 'critical'],
    });
  });

  it('redirects unauthenticated /families without horizontal overflow', () => {
    cy.visit('/families');
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.lte(doc.documentElement.clientWidth + 1);
    });
  });
});
