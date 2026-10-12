describe('Brand logo', () => {
  it('shows owl brand mark on login without house glyph', () => {
    cy.viewport(390, 844);
    cy.visit('/login');
    cy.injectAxe();
    cy.contains('Спокойная забота').should('be.visible');
    cy.get('body').should('not.contain', '⌂');
    cy.contains('p', 'Carelink').should('be.visible');
    cy.checkA11y(undefined, {
      includedImpacts: ['serious', 'critical'],
    });
  });
});
