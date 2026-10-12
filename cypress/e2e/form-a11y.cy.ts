describe('Forms a11y (axe)', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.injectAxe();
  });

  it('login form has no serious axe violations', () => {
    cy.checkA11y(undefined, {
      includedImpacts: ['serious', 'critical'],
    });
  });

  it('login with field error state stays clean', () => {
    cy.get('#workspaceSlug').type('valid-family');
    cy.get('#password').type('short');
    cy.contains('button', 'Войти').click({ force: true });
    cy.contains('Не короче 8 символов').should('be.visible');
    cy.checkA11y(undefined, {
      includedImpacts: ['serious', 'critical'],
    });
  });
});
