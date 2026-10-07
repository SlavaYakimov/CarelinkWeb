Cypress.Commands.add('visitLogin', () => {
  cy.visit('/login');
  cy.contains('h3', 'Вход в Carelink').should('be.visible');
});

Cypress.Commands.add('fillWorkspaceLogin', (email: string, password: string) => {
  cy.get('#workspaceEmail').clear().type(email);
  cy.get('#password').clear().type(password);
  cy.contains('button', 'Войти').click();
});
