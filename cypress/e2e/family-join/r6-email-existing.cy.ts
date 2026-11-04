describe('family-join R6', () => {
  it('[R6] email уже зарегистрирован — экран 46', () => {
    cy.seedJoinFlow({
      step: 'taken',
      personalEmail: 'anna@example.com',
    });
    cy.visit('/invites/email/taken');
    cy.contains('h1', 'Почта уже в аккаунте').should('be.visible');
    cy.contains('button', 'Войти как anna@example.com').should('be.visible');
  });
});
