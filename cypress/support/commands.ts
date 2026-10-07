Cypress.Commands.add('visitLogin', () => {
  cy.visit('/login');
  cy.contains('h3', 'Вход в Carelink').should('be.visible');
});

function workspaceSlugFromLogin(value: string): string {
  const at = value.indexOf('@');
  return at > 0 ? value.slice(0, at) : value;
}

Cypress.Commands.add('fillWorkspaceLogin', (emailOrSlug: string, password: string) => {
  cy.get('#workspaceSlug').clear().type(workspaceSlugFromLogin(emailOrSlug));
  cy.get('#password').clear().type(password);
  cy.contains('button', 'Войти').click();
});
