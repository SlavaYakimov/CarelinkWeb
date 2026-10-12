describe('Form gating (client schema)', () => {
  it('disables login until slug and password valid', () => {
    cy.visit('/login');
    cy.contains('button', 'Войти').should('be.disabled');
    cy.get('#workspaceSlug').type('ab');
    cy.get('#password').type('short');
    cy.contains('button', 'Войти').should('be.disabled');
    cy.get('#workspaceSlug').clear().type('valid-family');
    cy.get('#password').clear().type('validpass1');
    cy.contains('button', 'Войти').should('not.be.disabled');
  });

  it('disables onboarding email send until valid email', () => {
    cy.visit('/onboarding/email');
    cy.contains('button', 'Отправить код').should('be.disabled');
    cy.get('#email').type('not-an-email');
    cy.contains('button', 'Отправить код').should('be.disabled');
    cy.get('#email').clear().type('user@example.com');
    cy.contains('button', 'Отправить код').should('not.be.disabled');
  });
});
