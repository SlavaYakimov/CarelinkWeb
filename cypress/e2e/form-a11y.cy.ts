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

  it('password field toggle has aria-pressed and describedby checklist', () => {
    cy.get('#password')
      .should('have.attr', 'aria-describedby')
      .and('include', 'password-format-hint');
    cy.get('button[aria-label="Показать пароль"]').should('have.attr', 'aria-pressed', 'false');
    cy.get('button[aria-label="Показать пароль"]').click();
    cy.get('button[aria-label="Скрыть пароль"]').should('have.attr', 'aria-pressed', 'true');
  });
});
