describe('guest routing flow', () => {
  it('opens / and lands on login with the sign-in form', () => {
    cy.visit('/');
    cy.location('pathname').should('eq', '/login');
    cy.get('#workspaceSlug').should('be.visible');
    cy.get('#password').should('be.visible');
  });
});
